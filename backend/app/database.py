import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 환경변수에서 DB URL을 가져오거나, 없으면 로컬용 기본값
DATABASE_URL = os.environ.get("DATABASE_URL")


# SQLAlchemy Engine 생성
engine = create_engine(DATABASE_URL, echo=True)

# 세션(Session) 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스(모델들이 이를 상속)
Base = declarative_base()

from . import models