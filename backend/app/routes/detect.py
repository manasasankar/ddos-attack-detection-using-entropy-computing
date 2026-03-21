from fastapi import APIRouter, Query, Request
from sqlalchemy import func, text
import numpy as np
import os
import pickle

from app.database import SessionLocal
from app.detector.entropy import calculate_entropy
from app.models import AttackLog, Detection, SuspiciousIP
from app.services.realtime_monitor import monitor

router = APIRouter()

model_path = "model/ddos_model.pkl"
ml_model = None
if os.path.exists(model_path):
    with open(model_path, "rb") as f:
        ml_model = pickle.load(f)


@router.post("/detect")
async def detect_ddos(request: Request):
    data = await request.json()
    ip_list = [ip.strip() for ip in data.get("ip_list", []) if ip and ip.strip()]
    features = data.get("features", [])
    entropy_value = calculate_entropy(ip_list)
    req_count = len(ip_list)
    top_ip = "-"
    top_count = 0
    if ip_list:
        counts = {}
        for ip in ip_list:
            counts[ip] = counts.get(ip, 0) + 1
        top_ip = max(counts, key=counts.get)
        top_count = counts[top_ip]
    reasons = []
    if top_count >= 5:
        reasons.append(f"repeated_ip_hits({top_ip}:{top_count})")
    if req_count >= 40:
        reasons.append(f"traffic_spike(requests={req_count})")
    if entropy_value < 1.2:
        reasons.append(f"entropy_drop({entropy_value:.3f}<1.2)")

    ml_prediction = "normal"
    if ml_model is not None and features and len(features) >= 8:
        pred_raw = int(ml_model.predict(np.array(features[:8]).reshape(1, -1))[0])
        ml_prediction = "attack" if pred_raw == 1 else "normal"
    status = "attack" if (reasons or ml_prediction == "attack") else "normal"
    reason_text = ", ".join(reasons) if reasons else "manual test traffic within bounds"

    db = SessionLocal()
    try:
        db_status_text = "Possible DDoS attack detected" if status == "attack" else "Normal traffic"
        db.add(Detection(entropy=entropy_value, status=db_status_text))
        if status == "attack":
            db.add(
                AttackLog(
                    ip_address=top_ip,
                    request_count=req_count,
                    entropy_value=entropy_value,
                    status=status,
                    reason=reason_text,
                    source="manual",
                )
            )
            for ip in set(ip_list):
                record = db.query(SuspiciousIP).filter(SuspiciousIP.ip == ip).first()
                if record:
                    record.count += 1
                else:
                    db.add(SuspiciousIP(ip=ip, count=1))
        db.commit()
    finally:
        db.close()

    return {
        "entropy": float(entropy_value),
        "ml_prediction": ml_prediction,
        "status": status,
        "reason": reason_text,
        "request_count": req_count,
    }


@router.post("/monitor/start")
def start_monitor(interface: str | None = Query(default=None), simulation: bool = Query(default=False)):
    return monitor.start(interface=interface, use_simulation=simulation)


@router.post("/monitor/stop")
def stop_monitor():
    return monitor.stop()


@router.get("/monitor/state")
def monitor_state():
    return monitor.state()


@router.get("/attack-logs")
def get_attack_logs(limit: int = Query(default=100, ge=1, le=500)):
    db = SessionLocal()
    try:
        rows = db.query(AttackLog).order_by(AttackLog.id.desc()).limit(limit).all()
        return [
            {
                "id": row.id,
                "ip_address": row.ip_address,
                "request_count": row.request_count,
                "entropy_value": row.entropy_value,
                "status": row.status,
                "reason": row.reason,
                "source": row.source,
                "timestamp": row.timestamp.isoformat() if row.timestamp else None,
            }
            for row in rows
        ]
    finally:
        db.close()


@router.get("/history")
def get_detection_history():
    db = SessionLocal()
    try:
        records = db.query(Detection).order_by(Detection.id.desc()).limit(200).all()
        return [
            {
                "id": r.id,
                "entropy": r.entropy,
                "status": r.status,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in records
        ]
    finally:
        db.close()


@router.get("/latest-detection")
def get_latest_detection():
    db = SessionLocal()
    try:
        record = db.query(Detection).order_by(Detection.id.desc()).first()
        if not record:
            return {}
        return {
            "id": record.id,
            "entropy": record.entropy,
            "status": record.status,
            "timestamp": record.timestamp.isoformat() if record.timestamp else None,
        }
    finally:
        db.close()


@router.get("/suspicious-ips")
def get_suspicious_ips():
    db = SessionLocal()
    try:
        ips = db.query(SuspiciousIP).order_by(SuspiciousIP.count.desc()).limit(100).all()
        return [
            {
                "ip": ip.ip,
                "count": ip.count,
                "last_detected": ip.last_detected.isoformat() if ip.last_detected else None,
            }
            for ip in ips
        ]
    finally:
        db.close()


@router.get("/attack-stats")
def get_attack_stats():
    db = SessionLocal()
    try:
        total = db.query(func.count(Detection.id)).scalar() or 0
        attack_count = db.query(func.count(Detection.id)).filter(Detection.status.ilike("%Possible DDoS%")).scalar() or 0
        normal_count = total - attack_count
        avg_entropy = db.query(func.avg(Detection.entropy)).scalar()
        entropy_vs_rf = monitor.state().get("latest", {})
        return {
            "total_detections": total,
            "attack_count": attack_count,
            "normal_count": normal_count,
            "average_entropy": float(avg_entropy) if avg_entropy is not None else None,
            "per_day": [],
            "comparison": {
                "entropy_status": entropy_vs_rf.get("entropy_status"),
                "rf_status": entropy_vs_rf.get("rf_status"),
                "final_status": entropy_vs_rf.get("final_status"),
            },
        }
    finally:
        db.close()


@router.get("/health")
def system_health():
    db_ok = False
    db = None
    db_error = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        db_ok = False
        db_error = str(exc)
    finally:
        if db is not None:
            db.close()
    return {
        "database": "ok" if db_ok else "error",
        "model_loaded": ml_model is not None,
        "realtime_mode": monitor.mode,
        "capture_running": monitor.running,
        "db_error": db_error,
    }
