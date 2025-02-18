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
pdf_file_path = "chatbot/file/1.pdf"

# PDF 파일을 분석하여 표 데이터 추출
with open(pdf_file_path, "rb") as f:
    poller = client.begin_analyze_document("prebuilt-layout", f)
    result = poller.result()

# 추출된 표 데이터에서 필요한 정보 가져오기
tables = result.tables
json_result = []

# 변환할 표 데이터를 새로운 형식으로 변환
for table in tables:
    # 각 표의 행과 열을 가져옴
    headers = [cell.content for cell in table.cells if cell.row_index == 0]  # 첫 번째 행이 헤더
    rows = {}
    
    for cell in table.cells:
        # 데이터가 있는 셀만 추출
        if cell.row_index != 0:
            row_idx = cell.row_index
            col_idx = cell.column_index
            if row_idx not in rows:
                rows[row_idx] = {}
            rows[row_idx][headers[col_idx]] = cell.content

    # 각 행을 하나씩 JSON 형식으로 변환
    for row_idx, row_data in rows.items():
        # 표 데이터를 JSON 형식으로 변환
        json_result.append({
            "chapter_id": 3,
            "chapter_title": "사업별 주요 내용",
            "title": row_data.get("사업명", ""),
            "content": {
                "사업개요": row_data.get("사업개요", ""),
                "지원내용": row_data.get("지원내용", "").split() if "지원내용" in row_data else [],
                "지원대상": row_data.get("지원대상", ""),
                "예산(억원)": row_data.get("예산(억원)", ""),
                "사업공고일": row_data.get("사업공고일", ""),
                "소관부처": row_data.get("소관부처", ""),
                "전담(주관)기관": row_data.get("전담(주관)기관", "")
            }
        })

# JSON 파일로 저장
json_file_path = "output_table_data.json"  # 저장할 JSON 파일 경로
with open(json_file_path, "w", encoding="utf-8") as json_file:
    json.dump(json_result, json_file, ensure_ascii=False, indent=2)

print(f"JSON 파일로 저장되었습니다: {json_file_path}")
