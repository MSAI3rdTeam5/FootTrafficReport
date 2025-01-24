# 베이스 이미지
FROM python:3.12-slim

# 작업 디렉토리
WORKDIR /app

# 의존성 설치
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 포트 공개
EXPOSE 8000

# 컨테이너 구동 시 명령어
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
