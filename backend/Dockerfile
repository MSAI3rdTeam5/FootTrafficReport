# === Build Stage ===
FROM python:3.12-slim as builder

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사 및 시스템 의존성 설치
COPY requirements.txt .
RUN apt-get update && apt-get install -y build-essential libpq-dev \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# === Production Stage ===
FROM python:3.12-slim

WORKDIR /app

# 런타임에 필요한 시스템 의존성 설치
RUN apt-get update && apt-get install -y libpq-dev && apt-get clean

# Builder 단계에서 설치된 파이썬 패키지를 복사
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

# 전체 소스 코드 복사
COPY . .

EXPOSE 8000

# 컨테이너 시작 시 Uvicorn 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]