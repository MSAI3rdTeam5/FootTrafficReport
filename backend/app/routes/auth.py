from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Member, Auth
from ..schemas import UserCreate, UserResponse

router = APIRouter()

@router.post("/google-login")
async def google_login(user_data: dict, db: Session = Depends(get_db)):
    try:
        # 이메일로 기존 회원 조회
        user = db.query(Member).filter(Member.email == user_data["email"]).first()
        
        if not user:
            # 새 회원 생성
            user = Member(
                email=user_data["email"],
                name=user_data["name"],
                subscription_plan="FREE"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Auth 정보 저장
            auth = Auth(
                member_id=user.id,
                provider="google",
                access_token=user_data["credential"]
            )
            db.add(auth)
            db.commit()
        
        return {
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
