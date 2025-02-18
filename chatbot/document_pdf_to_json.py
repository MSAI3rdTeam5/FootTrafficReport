import os
import json
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Azure Document Intelligence 설정
AZURE_ENDPOINT = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
AZURE_KEY = os.getenv("AZURE_FORM_RECOGNIZER_API_KEY")

# DocumentAnalysisClient 인스턴스 생성
client = DocumentAnalysisClient(AZURE_ENDPOINT, AzureKeyCredential(AZURE_KEY))

# PDF 파일 경로
pdf_file_path = "chatbot/file/4-88.pdf"

# PDF 파일을 분석하여 표 데이터 추출
with open(pdf_file_path, "rb") as f:
    poller = client.begin_analyze_document("prebuilt-layout", f)
    result = poller.result()

# 추출된 표 데이터에서 필요한 정보 가져오기
tables = result.tables
json_result = []

# 각 표를 분석하여 JSON 형식으로 변환
for table in tables:
    table_data = []
    # 셀 데이터를 행과 열 단위로 나누어 처리
    rows = {}
    
    for cell in table.cells:
        row_idx = cell.row_index
        col_idx = cell.column_index
        if row_idx not in rows:
            rows[row_idx] = {}
        # content 속성으로 셀의 텍스트를 가져옴
        rows[row_idx][f"Column_{col_idx + 1}"] = cell.content
    
    # 행을 table_data에 추가
    for row_idx in sorted(rows.keys()):
        table_data.append(rows[row_idx])
    
    json_result.append(table_data)

# JSON 파일로 저장
json_file_path = "output_table_data1.json"  # 저장할 JSON 파일 경로
with open(json_file_path, "w", encoding="utf-8") as json_file:
    json.dump(json_result, json_file, ensure_ascii=False, indent=2)

print(f"JSON 파일로 저장되었습니다: {json_file_path}")
