import pandas as pd
from gpt_response import gpt_response
import os
import markdown
import pdfkit
import re

data_file = "./yearly_data/decrease_trend_year_data.csv" 
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
    
def markdown_to_pdf(markdown_text, output_pdf_path):
    # 1. Markdown 텍스트를 HTML로 변환
    html_content = markdown.markdown(markdown_text, extensions=["fenced_code", "tables"])

    # 2. "추천 전략" 및 "종합 결론" 부분을 박스로 가두는 함수
    def add_boxes(html):
        # 박스 색상 리스트
        colors = ["#f9f9f9", "#e8f5e9", "#e3f2fd", "#fff3e0", "#fbe9e7"]
        color_count = len(colors)
        
        def colorize(match, count=[0]):
            # 색상을 순환적으로 적용
            color = colors[count[0] % color_count]
            count[0] += 1
            box_style = (
                f'<div style="border: 2px solid #4CAF50; padding: 10px; margin: 10px 0; '
                f'background-color: {color}; border-radius: 5px;">'
            )
            return f'{box_style}{match.group(1)}</div>'

        # "추천 전략" 부분을 박스로 감싸기 (p, br 포함)
        html = re.sub(
            r'(<p><strong>추천 전략:.*?</p>)',
            lambda m: colorize(m, [0]),
            html, flags=re.DOTALL
        )

        # "종합 결론" 부분 감지 및 변환
        conclusion_box_style = (
            '<div style="border: 2px solid #FF5722; padding: 10px; margin: 10px 0; '
            'background-color: #fff8e1; border-radius: 5px;">'
        )
        html = re.sub(
            r'(<p><strong>추천 전략 요약:</strong>.*?</p>)',
            lambda m: f"{conclusion_box_style}{m.group(1)}</div>",
            html, flags=re.DOTALL
        )

        return html

    # 3. 로컬 이미지 경로를 절대 경로로 변환
    def convert_local_image_paths(html):
        base_path = os.path.abspath("")  # 현재 작업 디렉터리 절대 경로
        base_path = base_path[0].upper() + base_path[1:]  # 드라이브 문자를 대문자로 변환
        base_url = f"file:///{base_path.replace(os.sep, '/')}"  # 경로 구분자를 슬래시로 변경하고 file:// 프로토콜 추가
        return html.replace('src="', f'src="{base_url}/')

    # HTML 변환 적용
    # html_content = add_boxes(html_content)
    html_content = convert_local_image_paths(html_content)

    # HTML을 파일로 저장 (디버깅용)
    with open("test.html", "w", encoding="utf-8") as f:
        f.write(html_content)

    # 4. wkhtmltopdf 실행 파일 경로 설정
    config = pdfkit.configuration(wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe")  # Windows 경로 예시

    # 5. HTML을 PDF로 변환
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
        pdfkit.from_string(html_content, output_pdf_path, options=options, configuration=config)
        print(f"PDF 파일이 저장되었습니다: {output_pdf_path}")
    except Exception as e:
        print(f"PDF 생성 중 오류가 발생했습니다: {e}")





output_pdf_path = "report_v3.pdf"
markdown_to_pdf(response, output_pdf_path)
