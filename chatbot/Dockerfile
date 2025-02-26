# chatbot/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 포트 공개(예: 8700번)
EXPOSE 8700

# 6. 애플리케이션 실행
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8700"]