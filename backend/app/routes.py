from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status, Body
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import io
from fastapi.responses import StreamingResponse
from .deps import get_db
from .models import (
    Member, CctvInfo, CctvData,
    PersonCount, Auth, Withdrawal, Report
)
from pydantic import BaseModel
from .azure_blob import upload_image_to_azure
from .hashing import get_password_hash, verify_password # 해싱 함수
from .jwt_utils import create_jwt_token # 토큰 발급 함수
import os
import jwt
from jwt import PyJWTError, ExpiredSignatureError



router = APIRouter()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
REFRESH_SECRET = os.getenv("REFRESH_SECRET")

# -----------------------------
# Security Dependency
# -----------------------------
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate token")
    
    user = db.query(Member).filter(Member.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# -----------------------------------------------------------
# 1) Member 테이블 관련
# -----------------------------------------------------------

class MemberCreate(BaseModel):
    email: str
    password: str
    name: str
    subscription_plan: Optional[str] = "FREE"

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    subscription_plan: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/members", response_model=dict)
def create_member(data: MemberCreate, db: Session = Depends(get_db)):
    # 중복 email 체크 예시
    exists = db.query(Member).filter(Member.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hashed = get_password_hash(data.password)

    new_member = Member(
        email=data.email,
        password=password_hashed,
        name=data.name,
        subscription_plan=data.subscription_plan
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return {"message": "member created", "id": new_member.id}


@router.post("/login", response_model=dict)
def login_user(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Member).filter(Member.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Access Token (짧은 만료, 예: 300초=5분)
    access_token = create_jwt_token({"sub": user.email}, key_type="access", expires_in=300)

    # Refresh Token (긴 만료, 예: 7일=604800초)
    refresh_token = create_jwt_token({"sub": user.email}, key_type="refresh", expires_in=604800)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=dict)
def refresh_token(refresh_token: str = Body(...), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET, algorithms=["HS256"])
        user_email = payload.get("sub")   # ex. user_email
        if not user_email:
            raise HTTPException(401, "Invalid token payload")
    except ExpiredSignatureError:
        raise HTTPException(401, "Refresh token expired")
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")

    # DB에서 user를 찾고, 유효하면 access token 재발급
    user = db.query(Member).filter(Member.email == user_email).first()
    if not user:
        raise HTTPException(404, "User not found")

    # 새 Access token
    new_access_token = create_jwt_token({"sub": user_email}, expires_in=300)
    return {"access_token": new_access_token}



@router.get("/members/me", response_model=dict)
def get_current_member(current_user: Member = Depends(get_current_user)):
    """
    현재 인증된 사용자의 정보를 반환합니다.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "subscription_plan": current_user.subscription_plan,
    }

@router.get("/members", response_model=List[dict])
def list_members(db: Session = Depends(get_db)):
    members = db.query(Member).all()
    results = []
    for m in members:
        results.append({
            "id": m.id,
            "email": m.email,
            "name": m.name,
            "subscription_plan": m.subscription_plan
        })
    return results

# @router.get("/members/{member_id}", response_model=dict)
# def get_member(member_id: int, db: Session = Depends(get_db)):
#     member = db.query(Member).filter(Member.id == member_id).first()
#     if not member:
#         raise HTTPException(status_code=404, detail="Member not found")
#     return {
#         "id": member.id,
#         "email": member.email,
#         "name": member.name,
#         "subscription_plan": member.subscription_plan
#     }

@router.put("/members/{member_id}", response_model=dict)
def update_member(member_id: int, data: MemberUpdate, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if data.name is not None:
        member.name = data.name
    if data.subscription_plan is not None:
        member.subscription_plan = data.subscription_plan
    if data.password is not None:
        hashed_pw = get_password_hash(data.password)
        member.password = hashed_pw

    db.commit()
    db.refresh(member)
    return {"message": "member updated", "id": member.id}

@router.delete("/members/{member_id}", response_model=dict)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()
    return {"message": f"member {member_id} deleted"}


# -----------------------------------------------------------
# 2) cctv_info 테이블 관련
# -----------------------------------------------------------

class CctvInfoCreate(BaseModel):
    member_id: int
    cctv_name: str
    api_url: Optional[str] = None  # CCTV API 주소 (nullable)
    location: Optional[str] = None

class CctvInfoUpdate(BaseModel):
    cctv_name: Optional[str] = None
    api_url: Optional[str] = None  # CCTV API 주소 (nullable)
    location: Optional[str] = None

@router.post("/cctvs", response_model=dict)
def create_cctv(data: CctvInfoCreate, db: Session = Depends(get_db)):
    new_cctv = CctvInfo(
        member_id=data.member_id,
        cctv_name=data.cctv_name,
        api_url=data.api_url,  # 추가
        location=data.location,
    )
    db.add(new_cctv)
    db.commit()
    db.refresh(new_cctv)
    return {"message": "cctv created", "id": new_cctv.id}

@router.get("/cctvs/{member_id}", response_model=List[dict])
def list_cctvs(member_id: int,db: Session = Depends(get_db)):
    cctvs = db.query(CctvInfo).filter(CctvInfo.member_id == member_id).all()
    return [
        {
            "id": c.id,
            "member_id": c.member_id,
            "cctv_name": c.cctv_name,
            "api_url": c.api_url,
            "location": c.location
        } for c in cctvs
    ]

@router.get("/cctvs/{cctv_id}", response_model=dict)
def get_cctv(cctv_id: int, db: Session = Depends(get_db)):
    cctv = db.query(CctvInfo).filter(CctvInfo.id == cctv_id).first()
    if not cctv:
        raise HTTPException(status_code=404, detail="CCTV not found")
    return {
        "id": cctv.id,
        "member_id": cctv.member_id,
        "cctv_name": cctv.cctv_name,
        "api_url": cctv.api_url,
        "location": cctv.location
    }

@router.put("/cctvs/{cctv_id}", response_model=dict)
def update_cctv(cctv_id: int, data: CctvInfoUpdate, db: Session = Depends(get_db)):
    cctv = db.query(CctvInfo).filter(CctvInfo.id == cctv_id).first()
    if not cctv:
        raise HTTPException(status_code=404, detail="CCTV not found")

    if data.cctv_name is not None:
        cctv.cctv_name = data.cctv_name
    if data.location is not None:
        cctv.location = data.location
    if data.api_url is not None:
        cctv.api_url = data.api_url

    db.commit()
    db.refresh(cctv)
    return {"message": "cctv updated", "id": cctv.id}

@router.delete("/cctvs/{cctv_id}", response_model=dict)
def delete_cctv(cctv_id: int, db: Session = Depends(get_db)):
    cctv = db.query(CctvInfo).filter(CctvInfo.id == cctv_id).first()
    if not cctv:
        raise HTTPException(status_code=404, detail="CCTV not found")

    db.delete(cctv)
    db.commit()
    return {"message": f"cctv {cctv_id} deleted"}

# -----------------------------------------------------------
# 3) cctv_data 테이블 관련
# -----------------------------------------------------------

@router.post("/cctv_data", response_model=dict)
async def create_cctv_data(
    cctv_id: int = Form(...),
    detected_time: datetime = Form(...),
    person_label: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    image_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    image_url = None
    if image_file:
        file_bytes = await image_file.read()
        # Azure 업로드
        image_url = upload_image_to_azure(file_bytes, cctv_id)

    new_data = CctvData(
        cctv_id=cctv_id,
        detected_time=detected_time,
        person_label=person_label,
        gender=gender,
        age=age,
        image_url=image_url
    )
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return {
        "message": "cctv_data created",
        "id": new_data.id,
        "image_url": new_data.image_url
    }

@router.get("/cctv_data/{data_id}", response_model=dict)
def get_cctv_data(data_id: int, db: Session = Depends(get_db)):
    row = db.query(CctvData).filter(CctvData.id == data_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")

    return {
        "id": row.id,
        "cctv_id": row.cctv_id,
        "detected_time": row.detected_time,
        "person_label": row.person_label,
        "gender": row.gender,
        "age": row.age,
        "image_url": row.image_url
    }

@router.get("/cctv_data", response_model=List[dict])
def list_cctv_data(db: Session = Depends(get_db)):
    rows = db.query(CctvData).all()
    return [
        {
            "id": r.id,
            "cctv_id": r.cctv_id,
            "detected_time": r.detected_time,
            "person_label": r.person_label,
            "gender": r.gender,
            "age": r.age,
            "image_url": r.image_url
        }
        for r in rows
    ]

# -----------------------------------------------------------
# 4) person_count 테이블 관련
# -----------------------------------------------------------

class PersonCountCreate(BaseModel):
    cctv_id: int
    timestamp: datetime
    male_young_adult: int = 0
    female_young_adult: int = 0
    male_middle_aged: int = 0
    female_middle_aged: int = 0
    male_minor: int = 0
    female_minor: int = 0

@router.post("/person_count", response_model=dict)
def create_person_count(data: PersonCountCreate, db: Session = Depends(get_db)):
    new_count = PersonCount(
        cctv_id=data.cctv_id,
        timestamp=data.timestamp,
        male_young_adult=data.male_young_adult,
        female_young_adult=data.female_young_adult,
        male_middle_aged=data.male_middle_aged,
        female_middle_aged=data.female_middle_aged,
        male_minor=data.male_minor,
        female_minor=data.female_minor
    )
    db.add(new_count)
    db.commit()
    db.refresh(new_count)
    return {"message": "person_count created", "id": new_count.id}


@router.get("/person_count/{cctv_id}", response_model=List[dict])
def get_person_count_by_cctv_id(cctv_id: int, db: Session = Depends(get_db)):
    """
    cctv_id로 person_count 테이블을 조회,
    cctv_id가 일치하는 모든 레코드 반환.
    """

    records = db.query(PersonCount).filter(PersonCount.cctv_id == cctv_id).all()

    if not records:
        # CCTV ID가 존재하지 않거나, 아직 데이터가 없을 수 있음
        # 필요 시 에러 대신 빈 리스트 반환 가능
        raise HTTPException(status_code=404, detail="No records found for this cctv_id")

    # 여러 행을 각각 dict 형태로 변환
    results = []
    for pc in records:
        results.append({
            "id": pc.id,
            "cctv_id": pc.cctv_id,
            "timestamp": pc.timestamp,
            "male_young_adult": pc.male_young_adult,
            "female_young_adult": pc.female_young_adult,
            "male_middle_aged": pc.male_middle_aged,
            "female_middle_aged": pc.female_middle_aged,
            "male_minor": pc.male_minor,
            "female_minor": pc.female_minor
        })

    return results

# -----------------------------------------------------------
# 5) auth 테이블 (OAuth 정보)
# -----------------------------------------------------------

class AuthCreate(BaseModel):
    member_id: int
    provider: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None

@router.post("/auth", response_model=dict)
def create_auth(data: AuthCreate, db: Session = Depends(get_db)):
    new_auth = Auth(
        member_id=data.member_id,
        provider=data.provider,
        access_token=data.access_token,
        refresh_token=data.refresh_token
    )
    db.add(new_auth)
    db.commit()
    db.refresh(new_auth)
    return {"message": "auth created", "id": new_auth.id}

@router.get("/auth/{auth_id}", response_model=dict)
def get_auth(auth_id: int, db: Session = Depends(get_db)):
    at = db.query(Auth).filter(Auth.id == auth_id).first()
    if not at:
        raise HTTPException(status_code=404, detail="Auth not found")
    return {
        "id": at.id,
        "member_id": at.member_id,
        "provider": at.provider,
        "access_token": at.access_token,
        "refresh_token": at.refresh_token,
        "token_expires": at.token_expires
    }

# -----------------------------------------------------------
# 6) withdrawal 테이블
# -----------------------------------------------------------

class WithdrawalCreate(BaseModel):
    member_id: int

@router.post("/withdrawal", response_model=dict)
def create_withdrawal(data: WithdrawalCreate, db: Session = Depends(get_db)):
    # 실제로는 여기서 member 테이블에서 해당 유저 삭제 or 비활성화, etc.
    new_wd = Withdrawal(
        member_id=data.member_id
    )
    db.add(new_wd)
    db.commit()
    db.refresh(new_wd)
    return {"message": "withdrawal created", "id": new_wd.id}

@router.get("/withdrawal/{wd_id}", response_model=dict)
def get_withdrawal(wd_id: int, db: Session = Depends(get_db)):
    wd = db.query(Withdrawal).filter(Withdrawal.id == wd_id).first()
    if not wd:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": wd.id,
        "member_id": wd.member_id,
        "withdrawn_at": wd.withdrawn_at
    }

@router.get("/withdrawal", response_model=List[dict])
def list_withdrawals(db: Session = Depends(get_db)):
    wds = db.query(Withdrawal).all()
    return [
        {
            "id": w.id,
            "member_id": w.member_id,
            "withdrawn_at": w.withdrawn_at
        } for w in wds
    ]

# -----------------------------------------------------------
# 7) report 테이블
# -----------------------------------------------------------

@router.post("/report", response_model=dict)
async def upload_report(
    member_id: int = Form(...),
    cctv_id: int = Form(...),
    report_title: str = Form(...),
    summary_str: Optional[str] = Form(None),
    pdf_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Multipart/Form-Data로 PDF 업로드:
    1) 'member_id','cctv_id' (int), 'report_title' (str)은 Form 필드로 받음
    2) 'pdf_file'은 File(...)로 업로드
    3) 읽은 bytes를 DB의 LargeBinary 컬럼에 저장
    """
    # 1) 업로드된 PDF 파일 읽기
    pdf_bytes = await pdf_file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="No PDF file provided or file is empty")
    
     # summary_str -> JSON dict
    summary_json = None
    if summary_str:
        import json
        summary_json = json.loads(summary_str) 

    # 2) DB 저장
    new_report = Report(
        member_id=member_id,
        cctv_id=cctv_id,
        report_title=report_title,
        pdf_data=pdf_bytes,
        summary=summary_json
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return { "message": "report created", "id": new_report.id }

@router.get("/report/{member_id}", response_model=List[dict])
def get_reports_by_member(member_id: int, db: Session = Depends(get_db)):
    # 1) report & cctv_info 조인
    #    CctvInfo.id == Report.cctv_id
    #    CctvInfo.member_id == member_id
    reports = db.query(Report).filter(Report.member_id == member_id).all()

    if not reports:
        # 만약 데이터가 전혀 없으면 빈 리스트 반환 or 에러
        # 여기서는 그냥 빈 리스트 반환(404로 할 수도)
        return []

    return [
        {
            "id": r.id,
            "report_title":r.report_title,
            "summary": r.summary,
            "created_at":r.created_at
        }
        for r in reports
    ]

@router.get("/report/{report_id}", response_model=dict)
def get_report_info(report_id: int, db: Session = Depends(get_db)):
    """
    report의 메타데이터만 JSON으로 조회 (PDF는 제외)
    """
    rp = db.query(Report).filter(Report.id == report_id).first()
    if not rp:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "id": rp.id,
        "member_id": rp.id,
        "cctv_id": rp.cctv_id,
        "report_title": rp.report_title,
        "summary": rp.summary,
        "created_at": rp.created_at
    }



@router.get("/report/{report_id}/download")
def download_pdf(report_id: int, db: Session = Depends(get_db)):
    """
    DB에 저장된 pdf_data (bytes)를 PDF로 다운로드
    """
    rp = db.query(Report).filter(Report.id == report_id).first()
    if not rp:
        raise HTTPException(status_code=404, detail="Report not found")

    # 1) bytes -> IO 객체 변환
    pdf_stream = io.BytesIO(rp.pdf_data)

    # 2) StreamingResponse로 PDF 파일 전송
    # 'attachment; filename="..."' => 브라우저 다운로드
    return StreamingResponse(
        pdf_stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="report_{report_id}.pdf"'}
    )

@router.delete("/report/{report_id}", response_model=dict)
def delete_report(report_id: int, db: Session = Depends(get_db)):
    rp = db.query(Report).filter(Report.id == report_id).first()
    if not rp:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(rp)
    db.commit()
    return {"message": f"report {report_id} deleted"}