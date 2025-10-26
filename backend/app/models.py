from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    entropy = Column(Float)
    status = Column(String)
