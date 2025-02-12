import os
import re
import json
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# .env 파일에서 Azure 키와 엔드포인트 가져오기
endpoint = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT")
api_key = os.getenv("AZURE_FORM_RECOGNIZER_API_KEY")

# 출력하여 값 확인
print(f"Endpoint: {endpoint}")
print(f"API Key: {api_key}")

# API 키와 엔드포인트가 문자열인지 확인
if not isinstance(endpoint, str) or not isinstance(api_key, str):
    raise TypeError("API 키와 엔드포인트는 문자열이어야 합니다.")

# API 키나 엔드포인트가 비어 있는지 확인
if not endpoint or not api_key:
    raise ValueError("API 키나 엔드포인트가 비어 있습니다.")

# 클라이언트 생성
client = DocumentAnalysisClient(endpoint=endpoint, credential=AzureKeyCredential(api_key))

# PDF 파일 경로 설정
pdf_file_path = "소상공인기본법(법률)(제17623호)(20210309).pdf"

# PDF 파일을 읽어오기
with open(pdf_file_path, "rb") as file:
    poller = client.begin_analyze_document("prebuilt-document", file)
    result = poller.result()

# PDF에서 텍스트 추출
document_text = ""
for page in result.pages:
    for line in page.lines:
        document_text += line.content + "\n"

# 정규 표현식 패턴 정의
def parse_immigration_law(text):
    chapter_pattern = re.compile(r'^제(\d+)장\s+(.+)', re.MULTILINE)
    section_pattern = re.compile(r'^제(\d+)절\s+(.+)', re.MULTILINE)
    article_pattern = re.compile(r'^제(\d+)조(?:의(\d+))?\s*\(([^)]+)\)', re.MULTILINE)
    
    chapters = list(chapter_pattern.finditer(text))
    sections = list(section_pattern.finditer(text))
    articles = list(article_pattern.finditer(text))
    
    chapter_idx = 0
    section_idx = 0
    
    result = []
    
    current_chapter_num = None
    current_chapter_title = ""
    current_section_title = ""
    
    article_starts = [m.start() for m in articles]
    article_starts.append(len(text))
    
    for i, article in enumerate(articles):
        article_num = article.group(1)
        sub_num = article.group(2) if article.group(2) else ""
        article_title = article.group(3).strip()
        
        article_start = article.start()
        article_end = article.end()
        next_article_start = article_starts[i+1]
        
        content = text[article_end:next_article_start].strip()
        
        # 장 갱신
        while chapter_idx < len(chapters) and chapters[chapter_idx].start() < article_start:
            current_chapter_num = chapters[chapter_idx].group(1)
            current_chapter_title = chapters[chapter_idx].group(2).strip()
            current_section_title = ""
            chapter_idx += 1
        
        # 절 갱신
        while section_idx < len(sections) and sections[section_idx].start() < article_start:
            section_number = sections[section_idx].group(1)
            section_text = sections[section_idx].group(2).strip()
            current_section_title = f"제{section_number}절 {section_text}"
            section_idx += 1
        
        # chapter_id 구성
        if sub_num:
            chapter_id = f"{current_chapter_num}-{article_num}-{sub_num}"
        else:
            chapter_id = f"{current_chapter_num}-{article_num}"
        
        # chapter_title 구성
        if current_section_title:
            chapter_title = f"{current_chapter_title} - {current_section_title}"
        else:
            chapter_title = current_chapter_title
        
        json_obj = {
            "chapter_id": chapter_id,
            "chapter_title": chapter_title,
            "title": article_title,
            "content": content
        }
        
        result.append(json_obj)
    
    return result

# 텍스트 파싱 및 결과 생성
document_text = re.sub(r'(제\d+장[^\n]+?)\s+(제\d+절)', r'\1\n\2', document_text)  # 장, 절 사이에 줄바꿈 추가
parsed_law = parse_immigration_law(document_text)

# JSON 파일로 저장
output_file = "parsed_immigration_law.json"
with open(output_file, "w", encoding="utf-8") as json_file:
    json.dump(parsed_law, json_file, ensure_ascii=False, indent=2)

print(f"PDF 내용이 {output_file} 파일로 저장되었습니다.")
