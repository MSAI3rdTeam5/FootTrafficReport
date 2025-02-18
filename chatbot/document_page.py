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

# PDF에서 텍스트 추출 함수
def extract_text_from_pdf(pdf_path):
    try:
        with open(pdf_path, "rb") as f:
            poller = client.begin_analyze_document("prebuilt-read", document=f.read())  # 바이너리 데이터로 전달
            result = poller.result()  # 분석 완료 대기

        # 페이지별 텍스트 추출 및 페이지별로 저장
        pages_text = {}
        for i, page in enumerate(result.pages):
            page_text = "\n".join([line.content for line in page.lines])
            pages_text[f"page_{i+1}"] = page_text.strip()  # 페이지 번호와 텍스트 저장
        
        return pages_text
    
    except Exception as e:
        print(f"❌ PDF 텍스트 추출 오류: {e}")
        return None  # 실패 시 None 반환

# 정책 문서를 JSON으로 변환하는 함수 (정의 필요)
def parse_policy_document(pages_text):
    # 여기에 페이지별 텍스트를 JSON으로 변환하는 로직 추가
    return {"pages": pages_text}

# PDF 파일 경로
pdf_path = "chatbot/file/4-88.pdf"  # 실제 PDF 경로로 변경

# PDF에서 텍스트 추출
document_text = extract_text_from_pdf(pdf_path)

# JSON 변환 및 저장
if document_text:
    parsed_data = parse_policy_document(document_text)  # 변환 함수 호출

    # 결과 저장
    output_path = "4-88-1.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(parsed_data, f, ensure_ascii=False, indent=4)
    
    print(f"✅ JSON 데이터가 {output_path}에 저장되었습니다.")
else:
    print("❌ 저장할 데이터가 없습니다.")
