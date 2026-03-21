from collections import Counter, deque
from datetime import datetime
import math
import random
import threading
import time
from typing import Dict, List, Optional

import numpy as np
from sklearn.ensemble import RandomForestClassifier

from app.database import SessionLocal
from app.models import AttackLog, Detection, SuspiciousIP

try:
    from scapy.all import AsyncSniffer, IP  # type: ignore
except Exception:  # pragma: no cover
    AsyncSniffer = None
    IP = None


class RealtimeMonitor:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.running = False
        self.mode = "idle"
        self.interface = None
        self.sniffer = None
        self.processor = None
        self.source_ips: deque = deque(maxlen=8000)
        self.request_times: deque = deque(maxlen=12000)
        self.entropy_series: deque = deque(maxlen=120)
        self.recent_events: deque = deque(maxlen=120)
        self.error: Optional[str] = None
        self.window_seconds = 5
        self.rf_model = self._build_rf_model()
        self.analysis_thread = None

    def _build_rf_model(self) -> RandomForestClassifier:
        X = []
        y = []
        rng = random.Random(42)
        for _ in range(1200):
            entropy = rng.uniform(0.0, 5.0)
            req_rate = rng.uniform(1, 450)
            unique_ips = rng.uniform(1, 240)
            top_share = rng.uniform(0.02, 1.0)
            ddos = int((entropy < 1.2 and top_share > 0.35) or req_rate > 250 or top_share > 0.72)
            X.append([entropy, req_rate, unique_ips, top_share])
            y.append(ddos)
        model = RandomForestClassifier(n_estimators=80, random_state=42)
        model.fit(np.array(X), np.array(y))
        return model

    def _entropy(self, ips: List[str]) -> float:
        if not ips:
            return 0.0
        freq = Counter(ips)
        total = sum(freq.values())
        val = 0.0
        for count in freq.values():
            p = count / total
            val -= p * math.log2(p)
        return round(val, 4)

    def _packet_handler(self, packet) -> None:
        try:
            if IP is not None and packet.haslayer(IP):
                src = packet[IP].src
            else:
                return
            now = time.time()
            with self.lock:
                self.source_ips.append(src)
                self.request_times.append(now)
        except Exception:
            return

    def _simulation_loop(self) -> None:
        rnd = random.Random()
        bots = [f"203.0.113.{i}" for i in range(10, 40)]
        normal = [f"192.168.1.{i}" for i in range(2, 30)]
        while self.running and self.mode == "simulation":
            attack_burst = rnd.random() < 0.25
            picks = bots if attack_burst else normal
            burst = rnd.randint(18, 70) if attack_burst else rnd.randint(2, 12)
            now = time.time()
            with self.lock:
                for _ in range(burst):
                    self.source_ips.append(rnd.choice(picks))
                    self.request_times.append(now)
            time.sleep(1)

    def _analysis_loop(self) -> None:
        while self.running:
            try:
                self.evaluate()
            except Exception:
                pass
            time.sleep(2)

    def start(self, interface: Optional[str] = None, use_simulation: bool = False) -> Dict:
        if self.running:
            return {"status": "already_running", "mode": self.mode}
        self.error = None
        self.running = True
        self.interface = interface
        self.mode = "simulation" if use_simulation else "scapy"
        if self.mode == "scapy" and AsyncSniffer is None:
            self.mode = "simulation"
            self.error = "Scapy not available, switched to simulation mode."
        if self.mode == "scapy":
            self.sniffer = AsyncSniffer(prn=self._packet_handler, store=False, iface=interface)
            self.sniffer.start()
        else:
            self.processor = threading.Thread(target=self._simulation_loop, daemon=True)
            self.processor.start()
        self.analysis_thread = threading.Thread(target=self._analysis_loop, daemon=True)
        self.analysis_thread.start()
        return {"status": "started", "mode": self.mode, "interface": self.interface, "error": self.error}

    def stop(self) -> Dict:
        self.running = False
        if self.sniffer is not None:
            try:
                self.sniffer.stop()
            except Exception:
                pass
            self.sniffer = None
        return {"status": "stopped"}

    def evaluate(self) -> Dict:
        now = time.time()
        with self.lock:
            current_ips = list(self.source_ips)
            current_times = list(self.request_times)
            self.request_times = deque([t for t in self.request_times if now - t <= 120], maxlen=12000)
        window_ips = [ip for idx, ip in enumerate(current_ips) if idx >= max(0, len(current_ips) - 1500)]
        entropy = self._entropy(window_ips)
        req_rate = sum(1 for t in current_times if now - t <= self.window_seconds) / max(self.window_seconds, 1)
        freq = Counter(window_ips)
        unique_ips = len(freq)
        top_ip, top_count = ("-", 0)
        if freq:
            top_ip, top_count = freq.most_common(1)[0]
        top_share = (top_count / len(window_ips)) if window_ips else 0.0

        ent_hist = [p["entropy"] for p in self.entropy_series] or [entropy]
        rate_hist = [p["request_rate"] for p in self.entropy_series] or [req_rate]
        ent_mean = float(np.mean(ent_hist))
        ent_std = float(np.std(ent_hist)) or 0.01
        rate_mean = float(np.mean(rate_hist))
        rate_std = float(np.std(rate_hist)) or 0.5
        dyn_ent_low = max(0.2, ent_mean - 1.2 * ent_std)
        dyn_rate_high = max(15.0, rate_mean + 2.2 * rate_std)
        repeated_ip_limit = max(20, int(len(window_ips) * 0.35))

        reasons = []
        if entropy < dyn_ent_low:
            reasons.append(f"entropy_drop({entropy:.3f}<{dyn_ent_low:.3f})")
        if req_rate > dyn_rate_high:
            reasons.append(f"traffic_spike({req_rate:.2f}>{dyn_rate_high:.2f})")
        if top_count >= repeated_ip_limit and top_ip != "-":
            reasons.append(f"repeated_ip_hits({top_ip}:{top_count})")

        rf_pred = int(self.rf_model.predict(np.array([[entropy, req_rate, unique_ips, top_share]]))[0])
        rf_status = "attack" if rf_pred == 1 else "normal"
        entropy_status = "attack" if reasons else "normal"
        final_status = "attack" if (entropy_status == "attack" or rf_status == "attack") else "normal"
        reason = ", ".join(reasons) if reasons else "traffic within dynamic bounds"

        point = {
            "ts": datetime.utcnow().isoformat(),
            "entropy": entropy,
            "request_rate": round(req_rate, 2),
            "unique_ips": unique_ips,
            "top_ip": top_ip,
            "top_count": top_count,
            "dynamic_entropy_low": round(dyn_ent_low, 3),
            "dynamic_rate_high": round(dyn_rate_high, 3),
            "entropy_status": entropy_status,
            "rf_status": rf_status,
            "final_status": final_status,
            "reason": reason,
        }
        self.entropy_series.append(point)
        self.recent_events.append(point)
        self._persist(point)
        return point

    def _persist(self, point: Dict) -> None:
        db = SessionLocal()
        try:
            status_text = "Possible DDoS attack detected" if point["final_status"] == "attack" else "Normal traffic"
            db.add(Detection(entropy=point["entropy"], status=status_text))
            if point["final_status"] == "attack":
                db.add(
                    AttackLog(
                        ip_address=point["top_ip"],
                        request_count=point["top_count"],
                        entropy_value=point["entropy"],
                        status=point["final_status"],
                        reason=point["reason"],
                        source=self.mode,
                    )
                )
                if point["top_ip"] != "-":
                    record = db.query(SuspiciousIP).filter(SuspiciousIP.ip == point["top_ip"]).first()
                    if record:
                        record.count += 1
                        record.last_detected = datetime.utcnow()
                    else:
                        db.add(SuspiciousIP(ip=point["top_ip"], count=1, last_detected=datetime.utcnow()))
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    def state(self) -> Dict:
        point = self.entropy_series[-1] if self.entropy_series else self.evaluate()
        return {
            "running": self.running,
            "mode": self.mode,
            "interface": self.interface,
            "error": self.error,
            "latest": point,
            "series": list(self.entropy_series),
            "progress": min(100, int(len(self.entropy_series) * 2)),
        }


monitor = RealtimeMonitor()
