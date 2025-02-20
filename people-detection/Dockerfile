# people-detection/Dockerfile

FROM python:3.12-slim

# 1) apt-get update -> ffmpeg 설치
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 8500

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8500"]
