import pickle
import pandas as pd
from fastapi import FastAPI, Request
from app.routes import detect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://127.0.0.1:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


with open("model/ddos_model.pkl", "rb") as f:
    model = pickle.load(f)

app.include_router(detect.router)

@app.get("/")
def root():
    return {"message": "🚀 Backend is running successfully!"}


@app.post("/detect")
async def detect(request: Request):
    data = await request.json()
    
    # Example input data
    X = pd.DataFrame([{
        "Flow Duration": data["flow_duration"],
        "Total Fwd Packets": data["total_fwd_packets"],
        "Total Backward Packets": data["total_bwd_packets"],
        "Flow Packets/s": data["flow_packets_per_s"],
        "Flow Bytes/s": data["flow_bytes_per_s"],
        "Packet Length Mean": data["packet_len_mean"]
    }])
    
    prediction = model.predict(X)[0]
    status = "⚠️ Possible DDoS attack detected" if prediction == 1 else "✅ Normal traffic"
    
    return {"status": status}
