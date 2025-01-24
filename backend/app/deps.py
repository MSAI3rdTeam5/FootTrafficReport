from .database import SessionLocal

#FastAPI에서 DB 세션을 의존성으로 주입하기 위한 헬퍼 함수.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
