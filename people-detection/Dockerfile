FROM python:3.12-slim

# 1) apt-get update -> ffmpeg + PyAV 빌드/런타임에 필요한 라이브러리 설치
#    - libavdevice-dev, libavfilter-dev, libavformat-dev 등
#    - PyAV가 wheel(사전 컴파일 바이너리) 형태로 설치되면 dev 라이브러리가 없어도 될 수도 있지만,
#      대부분 빌드 시 필요한 경우가 많습니다.
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    gcc \
    libavdevice-dev \
    libavfilter-dev \
    libavformat-dev \
    libavcodec-dev \
    libavutil-dev \
    libswscale-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 8500

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8500"]
