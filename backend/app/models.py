from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, LargeBinary, func
from sqlalchemy.orm import relationship
from sqlalchemy import LargeBinary
from .database import Base

class Member(Base):
    __tablename__ = "member"
    id = Column(Integer, primary_key=True)
    email = Column(String(100), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    subscription_plan = Column(String(50), nullable=False, default="FREE")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())
    cctvs = relationship("CctvInfo", back_populates="owner")
    # ↑ Member 객체에서 .cctvs로 여러 개의 CctvInfo 접근 가능

    # auth relationship 설정 가능 (선택)


class CctvInfo(Base):
    __tablename__ = "cctv_info"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("member.id", ondelete="CASCADE"), nullable=False)
    cctv_name = Column(String(100), nullable=False)
    api_url = Column(String(255), nullable=True)  # CCTV API 주소
    location = Column(String(100))
    created_at = Column(TIMESTAMP, server_default=func.now())
    owner = relationship("Member", back_populates="cctvs")
    # ↑ CctvInfo 객체에서 .owner로 해당 Member 객체에 접근 가능
    reports = relationship("Report", back_populates="cctv")
    # ↑ "Report"는 아래 Report 클래스 명과 동일하게 문자열로 참조

class CctvData(Base):
    __tablename__ = "cctv_data"
    id = Column(Integer, primary_key=True)
    cctv_id = Column(Integer, ForeignKey("cctv_info.id", ondelete="CASCADE"), nullable=False)
    detected_time = Column(TIMESTAMP, nullable=False)
    person_label = Column(String(50))
    gender = Column(String(10))
    age = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=func.now())

class PersonCount(Base):
    __tablename__ = "person_count"
    id = Column(Integer, primary_key=True)
    cctv_id = Column(Integer, ForeignKey("cctv_info.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(TIMESTAMP, nullable=False)
    male_young_adult = Column(Integer, nullable=False, default=0)
    female_young_adult = Column(Integer, nullable=False, default=0)
    male_middle_aged = Column(Integer, nullable=False, default=0)
    female_middle_aged = Column(Integer, nullable=False, default=0)
    male_minor = Column(Integer, nullable=False, default=0)
    female_minor = Column(Integer, nullable=False, default=0)

class Auth(Base):
    __tablename__ = "auth"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("member.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now())

class Withdrawal(Base):
    __tablename__ = "withdrawal"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, nullable=False)
    withdrawn_at = Column(TIMESTAMP, server_default=func.now())

class Report(Base):
    __tablename__ = "report"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("member.id", ondelete="CASCADE"), nullable=False)
    cctv_id = Column(Integer, ForeignKey("cctv_info.id"), nullable=False)
    report_title = Column(String(200), nullable=False)
    # Postgres BYTEA -> in SQLAlchemy, you can use LargeBinary or BLOB
    # pdf_data = Column(String)
    pdf_data = Column(LargeBinary, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    cctv = relationship("CctvInfo", back_populates="reports")