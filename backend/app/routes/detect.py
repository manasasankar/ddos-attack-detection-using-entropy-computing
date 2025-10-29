from fastapi import APIRouter, Request
from app.detector.entropy import calculate_entropy
from app.database import SessionLocal
from app.models import Detection
import os

router = APIRouter()

def block_ip(ip):
    os.system(f"netsh advfirewall firewall add rule name='Block {ip}' dir=in action=block remoteip={ip}")
    print(f"🚫 Blocked IP: {ip}")


@router.post("/detect")
async def detect_ddos(request: Request):
    data = await request.json()
    ip_list = data.get("ip_list", [])

    entropy_value = calculate_entropy(ip_list)

    if entropy_value < 1.0:
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
        "entropy": entropy_value,
        "status": result
    }



@router.post("/unblock")
async def unblock_ip(request: Request):
    data = await request.json()
    ip_list = data.get("ip_list", [])

    unblocked_ips = []
    for ip in ip_list:
        command = f"netsh advfirewall firewall delete rule name='Block {ip}'"
        os.system(command)
        unblocked_ips.append(ip)

    return {"message": "✅ Unblocked IPs", "ips": unblocked_ips}
