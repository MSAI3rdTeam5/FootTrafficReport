from fastapi import FastAPI,HTTPException
import pandas as pd
from pydantic import BaseModel
import os
import markdown
import pdfkit
import re
from IPython.display import HTML
import requests
from .gpt_response import gpt_response


class ReportRequest(BaseModel):
    pdf_file: str
    member_id: int  
    cctv_id: int  
    report_title: str  
    persona: str  #businessType = persona
    start_date: str  
    end_date: str
 
app = FastAPI()

# origins = [
#     "http://localhost:5173",  # 프론트엔드 앱 URL
# ]
# from fastapi.middleware.cors import CORSMiddleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,  # 허용할 출처
#     allow_credentials=True,
#     allow_methods=["*"],  # 허용할 HTTP 메소드
#     allow_headers=["*"],  # 허용할 헤더
# )
 
# 데이터 경로 호출(당장은 실행되나 데이터 경로는 합치는 과정에서 수정과정 필요)
# data_file = "./FootTrafficReport/report-generation/yearly_data/decrease_trend_year_data.csv"
# data = pd.read_csv(data_file)
 
# 현재는 임의로 날짜를 기입했으나 여긴 프론트에서 바로 Input이 가능한 부분이 있는지 확인
start_date = "2025-02-28"
end_date = "2025-03-06"
persona = "돼지고기집"
# GPT를 호출하는 함수
# Input 값은 (페르소나, ~일간의 데이터를 기반으로 보고서 작성(user_inpput <- 우리가 임의로 작성할 것), Data, 시작시점, 종료시점)
 
# response = gpt_response(
#     "돼지고기집",
#     "일주일간의 데이터를 기반으로 보고서 작성해주세요",
#     data,
#     start_date=start_date,
#     end_date=end_date
# )
 
 
# 보고서를 HTML형식으로 전달받음. 이때 불필요한 앞뒤 내용을 정규표현식으로 제거    
def extract_html_content(response):
    match = re.search(r'<!DOCTYPE html>.*?</html>', response, re.DOTALL)
    return match.group(0) if match else response
 
# PDF로 변환하기 위한 HTML코드로 변환환
def save_html(response, html_file):
    extracted_content = extract_html_content(response)
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(extracted_content)
    print(f'HTML 파일이 생성되었습니다: {html_file}')
 
# CV팀에서 받은 데이터를 전처리해 시각화 한 그래프를 보고서에 넣기위한 함수
def convert_local_image_paths(html):
    base_path = os.path.abspath("")  # 현재 작업 디렉터리 절대 경로
    base_path = base_path[0].upper() + base_path[1:]  
    base_url = f"file:///{base_path.replace(os.sep, '/')}"
    return html.replace('src="', f'src="{base_url}/')
 
def report_generation(record_id: int):
    """
    record_id에 해당하는 person_count 레코드를 GET으로 가져옴.
    """
    base_url = "https://msteam5iseeu.ddns.net/api/person_count"
    url = f"{base_url}/{record_id}"  # ex) .../api/person_count/1
 
    try:
        response = requests.get(url, timeout=10)  # 10초 타임아웃
        response.raise_for_status()  # HTTP 에러 시 예외 발생
    except requests.exceptions.RequestException as e:
        print("Error calling person_count API:", e)
        return None
   
    # JSON 응답 파싱
    data = response.json()
    return data

# HTML파일을 PDF로 변환. 이떄 import하는 과정땜에 실행하려면 설치해야하는 라이브러리 필요(설치만 했을 때 안되는 경우 환경변수 설정 필요)
def convert_html_to_pdf(pdf_file, member_id, cctv_id, report_title,persona, start_date, end_date):
    try:
       
        # data_file = "./FootTrafficReport/report-generation/yearly_data/decrease_trend_year_data.csv"
        # data = pd.read_csv(data_file)
       
        result = report_generation(cctv_id)
        data = pd.DataFrame(result)
        data['timestamp'] = pd.to_datetime(data['timestamp'], format='ISO8601', errors='coerce')
 
 
        # 날짜와 시간 분리
        data['date'] = data['timestamp'].dt.date
        data['time'] = data['timestamp'].dt.strftime('%H:00')
       
        # 영어 요일을 한국어 요일로 변환
        weekday_map = {
            'Monday': '월', 'Tuesday': '화', 'Wednesday': '수', 'Thursday': '목',
            'Friday': '금', 'Saturday': '토', 'Sunday': '일'
        }
        data['day_of_week'] = data['timestamp'].dt.day_name().map(weekday_map)
       
        # 불필요한 컬럼(id, cctv_id, timestamp) 삭제
        data = data.drop(columns=['id', 'cctv_id', 'timestamp'])
 
        # 컬럼 순서 변경
        data = data[['date', 'time', 'day_of_week', 'male_young_adult', 'female_young_adult', 'male_middle_aged', 'female_middle_aged', 'male_minor', 'female_minor']]
       
        response = gpt_response(persona, f"{start_date}~{end_date}간의 데이터를 기반으로 보고서 작성해주세요", data, start_date = start_date, end_date = end_date)
       
        save_html(response, 'response.html')
        config = pdfkit.configuration(wkhtmltopdf='/usr/bin/wkhtmltopdf')
 
        options = {
            'encoding': 'UTF-8',
            'page-size': 'A4',
            'margin-top': '1in',
            'margin-right': '1in',
            'margin-bottom': '1in',
            'margin-left': '1in',
            'enable-local-file-access': True,
            'log-level': 'info'
        }
 
        pdfkit.from_file('response.html', pdf_file, options=options, configuration=config)
        print(f"PDF 파일 경로: {pdf_file}")
 
        # PDF 파일이 정상적으로 생성되었는지 확인
        with open(pdf_file, "rb") as f:
            files = {"pdf_file": ("report.pdf", f, "application/pdf")}
            data = {
                "member_id": member_id,
                "cctv_id": cctv_id,
                "report_title": report_title
            }
 
            url = "https://msteam5iseeu.ddns.net/api/report"
            response = requests.post(url, data=data, files=files, timeout=30)
            result = response.raise_for_status()
            print(f"응답 상태 코드: {response.status_code}")
            print(f"응답 본문: {response.text}")
            # print(result)
            return {"status": "success", "message": "Report successfully generated and uploaded.", "data": result}
 
    except Exception as e:
        print(f"오류 발생: {e}")
        return None
 


@app.post("/report")
async def generate_report(request: ReportRequest):
    """
    FastAPI 엔드포인트: 보고서 생성 요청을 받아 PDF를 생성하고 결과를 반환
    """
    result = convert_html_to_pdf(
        pdf_file=request.pdf_file,
        member_id=request.member_id,
        cctv_id=request.cctv_id,
        report_title=request.report_title,
        persona=request.persona,
        start_date=request.start_date,
        end_date=request.end_date
    )
 
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
   
    return result
   
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8600)
 
 