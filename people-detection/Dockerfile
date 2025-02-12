# people-detection/Dockerfile (예시)
FROM python:3.12-slim

# 작업 디렉토리 설정
WORKDIR /

# 의존성 파일 복사 및 설치
# people-detection 모듈에 필요한 라이브러리들을 people-detection/requirements.txt에 명시
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 전체 소스 코드 복사
COPY . .

# 서비스 실행: 예시로 src/main.py를 실행
CMD ["python", "src/main.py"]