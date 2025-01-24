from sqlalchemy import Column, String, Integer
from .database import Base

class PersonCount(Base):
    __tablename__ = "person_count"
    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    count = Column(Integer, nullable=False)
