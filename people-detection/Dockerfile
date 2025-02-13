# people-detection/Dockerfile

# 1. 베이스 이미지 선택 (Python 3.12-slim)
FROM python:3.12-slim

# ----- (추가) OpenCV 관련 라이브러리 설치 -----
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# 2. 컨테이너 내부 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 전체 소스 코드 복사 (src 폴더 내의 파일들을 /app/src로 복사)
COPY src/ ./src/

# 5. 컨테이너가 사용할 포트 노출 (people-detection 서비스는 8500번)
EXPOSE 8500

# 6. 애플리케이션 실행
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8500"]