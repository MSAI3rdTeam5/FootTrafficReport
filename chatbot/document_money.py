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

def extract_text_from_pdf(pdf_path):
    """Azure Document Intelligence를 사용하여 PDF에서 텍스트 추출"""
    with open(pdf_path, "rb") as file:
        poller = client.begin_analyze_document("prebuilt-document", file)
        result = poller.result()

    extracted_text = {}
    for i, page in enumerate(result.pages):
        page_text = "\n".join([line.content for line in page.lines])
        extracted_text[f"Page {i + 1}"] = page_text

    return extracted_text

def save_text_to_json(text_data, output_path):
    """추출된 텍스트를 JSON 파일로 저장"""
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(text_data, json_file, ensure_ascii=False, indent=4)

    print(f"✅ JSON 파일 저장 완료: {output_path}")

def main(pdf_path):
    extracted_text = extract_text_from_pdf(pdf_path)
    output_json = os.path.splitext(pdf_path)[0] + "_text.json"
    save_text_to_json(extracted_text, output_json)

if __name__ == "__main__":
    pdf_file_path = "chatbot/10-23.pdf"  # 여기에 처리할 PDF 파일 경로 입력
    main(pdf_file_path)
