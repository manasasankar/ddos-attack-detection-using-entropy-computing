from fastapi import FastAPI
from app.routes import detect

app = FastAPI()

app.include_router(detect.router)

@app.get("/")
def root():
    return {"message": "🚀 Backend is running successfully!"}
