from fastapi import APIRouter, Request
from app.detector.entropy import calculate_entropy
from app.database import SessionLocal
from app.models import Detection, SuspiciousIP
from sqlalchemy import func, text
import pickle, numpy as np, os, pandas as pd

router = APIRouter()

# Load ML model once at startup
model_path = "model/ddos_model.pkl"
with open(model_path, "rb") as f:
    ml_model = pickle.load(f)


def block_ip(ip):
  os.system(f'netsh advfirewall firewall add rule name="Block_{ip}" dir=in action=block remoteip={ip}')
  print(f"🚫 Blocked IP: {ip}")


def unblock_all_ips():
  """
  Best-effort removal of firewall rules we previously added as Block_<ip>.
  Uses the IPs tracked in the SuspiciousIP table.
  """
  db = SessionLocal()
  unblocked = []
  try:
    ips = db.query(SuspiciousIP.ip).distinct().all()
    for (ip,) in ips:
      rule_name = f"Block_{ip}"
      exit_code = os.system(f'netsh advfirewall firewall delete rule name="{rule_name}" >nul 2>&1')
      if exit_code == 0:
        unblocked.append(ip)
  finally:
    db.close()
  return unblocked


@router.post("/detect")
async def detect_ddos(request: Request):
    data = await request.json()
    ip_list = data.get("ip_list", [])
    features = data.get("features", [])  # feature list from dataset if needed

    entropy_value = calculate_entropy(ip_list)

    # ML Prediction
    if features:
        prediction = int(ml_model.predict(np.array(features[:8]).reshape(1, -1))[0])
    else:
        prediction = "Normal"

    # Hybrid Decision
    if entropy_value < 1.0 or prediction == "DDoS":
        result = "⚠️ Possible DDoS attack detected"
        for ip in set(ip_list):
            block_ip(ip)
    else:
        result = "✅ Normal traffic"

    db = SessionLocal()
    try:
        detection_record = Detection(
            entropy=entropy_value,
            status=result,
        )
        db.add(detection_record)
        db.flush()

        if result.startswith("⚠️"):
            for ip in set(ip_list):
                existing = (
                    db.query(SuspiciousIP)
                    .filter(SuspiciousIP.ip == ip)
                    .first()
                )
                if existing:
                    existing.count += 1
                    existing.last_detected = datetime.utcnow()
                else:
                    db.add(
                        SuspiciousIP(
                            ip=ip,
                            count=1,
                            last_detected=datetime.utcnow(),
                        )
                    )

        db.commit()
    finally:
        db.close()

    return {
        "entropy": float(entropy_value),
        "ml_prediction": prediction,
        "status": result,
    }


@router.post("/unblock")
async def unblock_all():
  unblocked_ips = unblock_all_ips()
  if unblocked_ips:
    msg = f"Unblocked firewall rules for IPs: {', '.join(unblocked_ips)}"
  else:
    msg = "No matching Block_<ip> firewall rules were found."
  return {"message": msg, "unblocked_ips": unblocked_ips}


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
        }
    finally:
        db.close()


@router.get("/suspicious-ips")
def get_suspicious_ips():
    db = SessionLocal()
    try:
        ips = (
            db.query(SuspiciousIP)
            .order_by(SuspiciousIP.count.desc())
            .limit(100)
            .all()
        )
        return [
            {
                "ip": ip.ip,
                "count": ip.count,
                "last_detected": ip.last_detected.isoformat()
                if ip.last_detected
                else None,
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
        attack_count = (
            db.query(func.count(Detection.id))
            .filter(Detection.status.like("⚠️%"))
            .scalar()
            or 0
        )
        normal_count = total - attack_count
        avg_entropy = db.query(func.avg(Detection.entropy)).scalar()

        return {
            "total_detections": total,
            "attack_count": attack_count,
            "normal_count": normal_count,
            "average_entropy": float(avg_entropy) if avg_entropy is not None else None,
            "per_day": [],
        }
    finally:
        db.close()


@router.get("/health")
def system_health():
    db_ok = False
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    finally:
        try:
            db.close()
        except Exception:
            pass

    model_ok = ml_model is not None

    return {
        "database": "ok" if db_ok else "error",
        "model_loaded": model_ok,
    }
