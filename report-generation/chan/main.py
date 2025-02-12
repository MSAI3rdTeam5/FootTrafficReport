import pandas as pd
from gpt_response import gpt_response
import os
import markdown
import pdfkit
import re
from IPython.display import HTML

data_file = "./FootTrafficReport/report-generation/chan/yearly_data/decrease_trend_year_data.csv" 
data = pd.read_csv(data_file)

start_date = "2024-01-01"
end_date = "2024-01-07"

response = gpt_response(
    "돼지고기집", 
    "일주일간의 데이터를 기반으로 보고서 작성해주세요", 
    data, 
    start_date=start_date, 
    end_date=end_date
)
    
def extract_html_content(response):
    match = re.search(r'<!DOCTYPE html>.*?</html>', response, re.DOTALL)
    return match.group(0) if match else response

def save_html(response, html_file):
    extracted_content = extract_html_content(response)
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(extracted_content)
    print(f'HTML 파일이 생성되었습니다: {html_file}')

def convert_local_image_paths(html):
    base_path = os.path.abspath("")  # 현재 작업 디렉터리 절대 경로
    base_path = base_path[0].upper() + base_path[1:]  # 드라이브 문자를 대문자로 변환
    base_url = f"file:///{base_path.replace(os.sep, '/')}"  # 경로 구분자를 슬래시로 변경하고 file:// 프로토콜 추가
    return html.replace('src="', f'src="{base_url}/')

def convert_html_to_pdf(html_file, pdf_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    html_content = convert_local_image_paths(html_content)
    
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
    
    try:
        pdfkit.from_file(html_file, pdf_file, options=options, configuration=config)
        print(f'PDF 파일이 저장되었습니다: {pdf_file}')
    except Exception as e:
        print(f'PDF 생성 중 오류가 발생했습니다: {e}')

# 사용 예시
print(response)
save_html(response, 'response.html')
convert_html_to_pdf('response.html', 'output_v3.pdf')

