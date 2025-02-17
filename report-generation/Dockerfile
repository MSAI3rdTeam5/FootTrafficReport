# report-generation/Dockerfile

FROM python:3.12-slim

WORKDIR /app

# report-generation 서비스에 필요한 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사 (report-generation 서비스는 src 폴더에 코드가 위치)
COPY src/ ./src/

# 컨테이너에서 사용할 포트 노출 (report-generation 서비스는 8600번)
EXPOSE 8600

# FastAPI 앱을 uvicorn으로 실행
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8600"]
