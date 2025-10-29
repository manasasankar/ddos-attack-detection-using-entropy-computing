from fastapi import APIRouter, Request
from app.detector.entropy import calculate_entropy
from app.database import SessionLocal
from app.models import Detection
import pickle, numpy as np, os

router = APIRouter()

# Load ML model once at startup
model_path = "model/ddos_model.pkl"
with open(model_path, "rb") as f:
    ml_model = pickle.load(f)

def block_ip(ip):
    os.system(f"netsh advfirewall firewall add rule name='Block_{ip}' dir=in action=block remoteip={ip}")
    print(f"🚫 Blocked IP: {ip}")

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
    detection_record = Detection(entropy=entropy_value, status=result)
    db.add(detection_record)
    db.commit()
    db.close()

    return {
    "entropy": float(entropy_value),
    "ml_prediction": prediction,
    "status": result
}
