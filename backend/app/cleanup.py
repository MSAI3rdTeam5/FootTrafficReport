from sqlalchemy.orm import Session
from .database import SessionLocal

def clean_old_data():
    db: Session = SessionLocal()
    try:
        # cctv_data - 3개월
        db.execute("""
            DELETE FROM cctv_data
            WHERE detected_time < NOW() - INTERVAL '3 months'
        """)

        # person_count - 1년
        db.execute("""
            DELETE FROM person_count
            WHERE timestamp < NOW() - INTERVAL '1 year'
        """)

        db.commit()
    finally:
        db.close()
