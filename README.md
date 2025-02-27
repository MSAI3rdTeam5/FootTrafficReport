# 팀 ISEEU: MS AI SCHOOL 5기 3차 5팀 프로젝트

![image](https://github.com/user-attachments/assets/3ad14ea7-cc07-434d-896e-658f5a3e7c73)
![image](https://github.com/user-attachments/assets/51e6854a-3460-4d15-898e-7991858d1d3f)

## 프로젝트 개요
### 팀 정보
- **프로젝트명:** CV 기반 유동인구 데이터베이스화 및 LLM 활용 보고서 및 대시보드 개발
- **팀 구성:** 나정환, 김현준, 남궁찬, 박성빈, 윤여경, 정성준, 조나경, 홍승우
- **프로젝트 기간:** 2025.01.16~ 2025.02.27

### 기획의도
1. 데이터 기반 의사결정을 위한 소상공인 개인별 데이터베이스를 구축할 수 있는 CV 모델 개발.
2. 유저 친화적 인터페이스를 통해 비전문가도 쉽게 데이터를 확인 가능한 통계분석 대시보드 서비스 개발.
3. 데이터 분석 결과를 활용하여 사용자 상황(context)에 맞는 상권 최적화 및 매출 개선 방안과 같은 인사이트 제공해 줄 수 있는 보고서 작성 자동화.
4. 전처리된 정책문서를 바탕으로 정보를 제공하는 챗봇 개발

## 기술 스택
- 프론트엔드: 
<img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white"/> <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white"/> <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white"/> <img src="https://img.shields.io/badge/WebRTC-333333?style=flat&logo=webrtc&logoColor=white"/> <img src="https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white"/>

- 백엔드: 
<img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white"/> <img src="https://img.shields.io/badge/NGINX-009639?style=flat&logo=nginx&logoColor=white"/> <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white"/>
- 데이터베이스: 
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white"/> <img src="https://img.shields.io/badge/Redis-FF4438?style=flat&logo=redis&logoColor=white"/> <img src="https://img.shields.io/badge/Celery-37814A?style=flat&logo=celery&logoColor=white"/> <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white"/>
- CV 모델: 
<img src="https://img.shields.io/badge/YOLO11%20nano-111F68?style=flat&logo=yolo&logoColor=white"/> <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat&logo=opencv&logoColor=white"/> <img src="https://img.shields.io/badge/AIOHTTP-2C5BB4?style=flat&logo=aiohttp&logoColor=white"/> <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=flat&logo=aiohttp&logoColor=white"/>
- LLM 모델: 
<img src="https://img.shields.io/badge/GPT_o3_mini-412991?style=flat&logo=openai&logoColor=white"/> <img src="https://img.shields.io/badge/Pandas-150458?style=flat&logo=pandas&logoColor=white"/>

## 서비스
- 내 모니터링  
  <img src="images/Monitering.png" width="200">

- CCTV 확인  
  <img src="images/Log_page.png" width="600">

- Dashboard  
  <img src="images/Dashboard.png" width="600">

- AI 인사이트  
  <img src="images/AIinsight.png" width="600">

- 챗봇  
  <img src="images/Chatbot_page.png" width="600">

## 서비스 아키텍처
- **Web page**  
  <img src="images/WebPage.png" width="600">

- **Server**  
  <img src="images/Server.png" width="600">

- **Database**  
  <img src="images/Database.png" width="600">

- **CV-model**  
  <img src="images/CV_model.png" width="600">

- **Report-generator**  
  <img src="images/Report_generater.png" width="600">

- **Chatbot**  
  <img src="images/Chat_bot.png" width="600">

## 프로젝트 구조도
```
FOOTTRAFFICREPORT [SSH: 20.39.188.60]
│── .github/
│── backend/
│   │── alembic/
│   │   │── __pycache__/
│   │   │── versions/
│   │   │   │── __pycache__/
│   │   │   │── (마이그레이션 스크립트 파일들)
│   │   │── env.py
│   │   │── README
│   │   │── script.py.mako
│   │── app/
│   │   │── __pycache__/
│   │   │── (FastAPI 관련 Python 파일들)
│   │── .env
│   │── alembic.ini
│   │── celerybeat-schedule
│   │── Dockerfile
│   │── requirements.txt
│── chatbot/
│   │── src/
│   │   │── main.py
│   │── .env
│   │── Dockerfile
│   │── requirements.txt
│── frontend/
│   │── .github/
│   │── client/
│   │   │── .vite/
│   │   │── dist/
│   │   │── node_modules/
│   │   │── public/
│   │   │── src/
│   │   │   │── components/
│   │   │   │   │── ProtectedRoute.jsx
│   │   │   │   │── ResponsiveNav.jsx
│   │   │   │── context/
│   │   │   │   │── AppContext.jsx
│   │   │   │── pages/
│   │   │   │   │── AInsight.jsx
│   │   │   │   │── CCTVMonitoring.jsx
│   │   │   │   │── Chatbot.jsx
│   │   │   │   │── Chatbot_guide.jsx
│   │   │   │   │── Dashboard.jsx
│   │   │   │   │── DeviceConnect.jsx
│   │   │   │   │── Guide.jsx
│   │   │   │   │── LiveStreamPlayer.jsx
│   │   │   │   │── Login.jsx
│   │   │   │   │── Monitor.jsx
│   │   │   │   │── PrivacyOverlay.jsx
│   │   │   │   │── Signup.jsx
│   │   │   │── utils/
│   │   │   │   │── api.js
│   │   │   │   │── apiWrapper.js
│   │   │   │   │── auth.js
│   │   │   │   │── srswebrtc.js
│   │   │   │── webrtc/
│   │   │   │   │── mediasoupclient.js
│   │   │   │── App.css
│   │   │   │── App.jsx
│   │   │   │── index.css
│   │   │   │── main.jsx
│   │   │── eslint.config.js
│   │   │── index.html
│   │   │── package-lock.json
│   │   │── package.json
│   │   │── postcss.config.cjs
│   │   │── tailwind.config.js
│   │   │── vite.config.js
│   │── server/
│   │   │── node_modules/
│   │   │── src/
│   │   │   │── hls/
│   │   │   │   │── ffmpegRunner.js
│   │   │   │   │── index.js
│   │   │   │   │── passportConfig.js
│   │   │   │   │── signaling.js
│   │   │── .env
│   │   │── Dockerfile
│   │   │── package-lock.json
│   │   │── package.json
│   │   │── .dockerignore
│   │   │── .gitmessage.txt
│   │   │── LICENSE
│── media-server/
│   │── .dockerignore
│   │── Dockerfile
│   │── index.js
│   │── package-lock.json
│   │── package.json
│── nginx/
│   │── mycctv.conf
│── people-detection/
│   │── data/
│   │── model/
│   │   │── yolo11n-pose.pt
│   │── src/
│   │   │── utils/
│   │   │   │── Augment.ipynb
│   │   │   │── Azure_Update.ipynb
│   │   │   │── Evaluate.py
│   │   │── main.py
│   │── .env
│   │── Dockerfile
│   │── requirements.txt
│── report-generation/
│   │── __pycache__/
│   │── data_graph/
│   │── fonts/
│   │   │── MalgunGothic.ttf
│   │── src/
│   │   │── __init__.py
│   │   │── data_processing.py
│   │   │── gpt_response.py
│   │   │── main.py
│   │   │── visualization.py
│   │── .env
│   │── Dockerfile
│   │── requirements.txt
│── srs/
│   │── srs.conf
│── .env
│── .gitignore
│── .gitmessage.txt
│── docker-compose.yml
│── LICENSE
│── package-lock.json
```



