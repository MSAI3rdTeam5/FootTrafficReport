import pandas as pd
import os
import markdown
import pdfkit
import re
from IPython.display import HTML
import time
import sys
import requests
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from gpt_response import gpt_response

# 데이터 경로 호출(당장은 실행되나 데이터 경로는 합치는 과정에서 수정과정 필요)
# data_file = "./FootTrafficReport/report-generation/yearly_data/decrease_trend_year_data.csv" 
# data = pd.read_csv(data_file)

# 현재는 임의로 날짜를 기입했으나 여긴 프론트에서 바로 Input이 가능한 부분이 있는지 확인
start_date = "2024-01-01"
end_date = "2024-01-07"
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
def convert_html_to_pdf(html_file, pdf_file, member_id, cctv_id, report_title,persona, start_date, end_date):
    try:
        
        # data_file = "./FootTrafficReport/report-generation/yearly_data/decrease_trend_year_data.csv"
        # data = pd.read_csv(data_file)
        
        data = report_generation(cctv_id)
        response = gpt_response(persona, f"{start_date}~{end_date}간의 데이터를 기반으로 보고서 작성해주세요", data, start_date = start_date, end_date = end_date)
        
        save_html(response, html_file)
        config = pdfkit.configuration(wkhtmltopdf=r"C:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe")

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

        pdfkit.from_file(html_file, pdf_file, options=options, configuration=config)

        # PDF 파일이 정상적으로 생성되었는지 확인
        with open(pdf_file, "rb") as f:
            files = {"pdf_file": f}
            data = {
                "member_id": member_id,
                "cctv_id": cctv_id,
                "report_title": report_title
            }

            url = "https://msteam5iseeu.ddns.net/api/report"
            response = requests.post(url, data=data, files=files, timeout=30)
            response.raise_for_status()
            return response.json()

    except Exception as e:
        print(f"오류 발생: {e}")
        return None


#현재는 테스트 중이기에 response.html 하나로만 사용하지만, 다수의 이용자가 동시에 사용했을 때 response도 관리가 필요하면 추후 수정해야함.
#저장되는 경로도 추후에 수정이 필요
# save_html(response, 'response.html')
convert_html_to_pdf('response.html', "aaa.pdf",2,1,"aaa",persona,start_date, end_date)


    
 
# if __name__ == "__main__":
#     # 예시 사용
#     pdf_path = "C:/Users/username/Documents/sample.pdf"
#     member_id = 1
#     cctv_id = 101
#     report_title = "Weekly Report"
 
#     result = upload_pdf_report(pdf_path, member_id, cctv_id, report_title)
#     print("Server response:", result)