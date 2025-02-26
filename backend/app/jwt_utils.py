# jwt_utils.py
import jwt
import time
import os

# 실제 프로젝트에서는 .env 또는 settings를 통해 SECRET_KEY를 관리
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
REFRESH_SECRET= os.getenv("REFRESH_SECRET")

def create_jwt_token(data: dict, key_type : str, expires_in: int = 300) -> str:
    """
    data: { "sub": user_email_or_id, ... }  # payload
    expires_in: 토큰 만료시간(초) (기본 3600*3=3시간)
    returns: JWT 문자열
    """
    current_time = int(time.time())
    expiry = current_time + expires_in

    payload = {
        "sub": data["sub"],  # 사용자 식별자
        "iat": current_time,  # 발행 시점 (issued at)
        "exp": expiry         # 만료 시점
        # 필요하면 "roles", "scopes" 등 추가
    }

    if key_type=="access":
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
    elif key_type=="refresh":
        token = jwt.encode(payload, REFRESH_SECRET, algorithm="HS256")
    else:
        raise ValueError(f"Invalid key_type: {key_type}")

    # Python 3.8+에서 PyJWT==2.x 인 경우 bytes가 아닌 str로 반환됨
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return token
