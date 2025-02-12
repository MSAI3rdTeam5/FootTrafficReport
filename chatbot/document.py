import os
import json
from dotenv import load_dotenv
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

# 환경 변수 로드
load_dotenv()

# Azure Document Intelligence 설정
AZURE_ENDPOINT = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
AZURE_KEY = os.getenv("AZURE_FORM_RECOGNIZER_API_KEY")

# DocumentAnalysisClient 인스턴스 생성
client = DocumentAnalysisClient(AZURE_ENDPOINT, AzureKeyCredential(AZURE_KEY))

# PDF 파일 경로
pdf_path = "chatbot/10-23.pdf"

# PDF 파일을 읽어서 분석
def analyze_pdf(pdf_path):
    with open(pdf_path, "rb") as f:
        poller = client.begin_analyze_document("prebuilt-layout", f)  # "prebuilt-layout"는 레이아웃 분석을 의미
        result = poller.result()
    
    return result

# 분석된 결과에서 필요한 데이터를 추출하여 JSON 형태로 변환
def convert_to_json(result):
    # PDF에서 추출된 텍스트와 기타 정보들을 변환
    purpose = ""
    loan_scale = ""
    eligibility = ""
    loan_conditions = {
        "interest_rate": "",
        "loan_term": "",
        "loan_limit": "",
        "loan_method": ""
    }
    
    # 결과에서 텍스트 추출 (레이아웃 분석에 기반한 예시)
    for page in result.pages:
        for line in page.lines:
            text = line.content
            if "자생력 제고" in text:
                purpose = text
            elif "융자규모" in text:
                loan_scale = text
            elif "소상공인기본법" in text:
                eligibility = text
            elif "대출금리" in text:
                loan_conditions["interest_rate"] = text
            elif "대출기간" in text:
                loan_conditions["loan_term"] = text
            elif "대출한도" in text:
                loan_conditions["loan_limit"] = text
            elif "대리대출" in text:
                loan_conditions["loan_method"] = text

    # 최종 JSON 구조
    loan_info = {
        "purpose": purpose,
        "loan_scale": loan_scale,
        "eligibility": eligibility,
        "loan_conditions": loan_conditions
    }

    return loan_info

# PDF 분석 실행
result = analyze_pdf(pdf_path)

# JSON으로 변환
loan_info_json = convert_to_json(result)

# JSON 출력
print(json.dumps(loan_info_json, ensure_ascii=False, indent=4))

# JSON을 파일로 저장
with open("loan_info.json", "w", encoding="utf-8") as json_file:
    json.dump(loan_info_json, json_file, ensure_ascii=False, indent=4)
