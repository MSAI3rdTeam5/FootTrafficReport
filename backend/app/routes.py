from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .deps import get_db
from .models import PersonCount

router = APIRouter()

# DB 생성
@router.post("/person_count")
def create_person_count(spot_id: str, timestamp: str, count: int, db: Session = Depends(get_db)):
    record = PersonCount(spot_id=spot_id, timestamp=timestamp, count=count)
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"message": "inserted", "id": record.id}

# DB 조회
@router.get("/person_count/{record_id}")
def read_person_count(record_id: int, db: Session = Depends(get_db)):
    record = db.query(PersonCount).filter(PersonCount.id == record_id).first()
    if not record:
        return {"error": "Not found"}
    return {
        "id": record.id,
        "spot_id": record.spot_id,
        "timestamp": record.timestamp,
        "count": record.count
    }