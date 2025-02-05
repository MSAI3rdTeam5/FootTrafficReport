import openai
import pandas as pd
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
import os
from dotenv import load_dotenv  # dotenv 라이브러리 추가

# .env 파일 로드
load_dotenv()

# OpenAI API 설정
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_version = "2024-08-01-preview"
openai.api_key = os.getenv("AZURE_OPENAI_KEY")

# Azure Cognitive Search 설정
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME")
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
AZURE_INDEX_NAME = os.getenv("AZURE_INDEX_NAME")

# Azure Search 클라이언트 설정
search_client = SearchClient(
    endpoint=AZURE_SEARCH_ENDPOINT,
    index_name=AZURE_INDEX_NAME,
    credential=AzureKeyCredential(AZURE_SEARCH_KEY)
)

# CSV 파일 로드 (이 경로를 실제 CSV 파일 위치로 수정하세요)
csv_file = 'chatbot/decrease_trend_year_data.csv'
data = pd.read_csv(csv_file)

# 사용자가 질문한 날짜와 카테고리를 추출하는 함수
def extract_date_and_category_from_question(question):
    prompt = f"질문: {question}\n\n출력 형식: {question}에 관련된 '날짜'와 '카테고리'를 출력해주세요."
    
    # OpenAI GPT-4를 사용하여 날짜와 카테고리 추출
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=100
    )

    # 모델의 답변에서 날짜와 카테고리 추출 (예: "2024-01-01", "남자 청년")
    extracted_info = response.choices[0].text.strip().split(',')
    date = extracted_info[0].strip()
    category = extracted_info[1].strip()
    
    return date, category

# CSV 파일에서 특정 날짜와 카테고리의 데이터를 합산하는 함수
def get_traffic_data_from_csv(date, category):
    # 주어진 날짜에 해당하는 데이터 추출
    filtered_data = data[data['date'] == date]
    
    # 카테고리에 맞는 열 선택하여 합산
    if category == '남자 청년':
        return filtered_data['male_young'].sum()
    elif category == '여자 청년':
        return filtered_data['female_young'].sum()
    elif category == '남자 중년':
        return filtered_data['male_adult'].sum()
    elif category == '여자 중년':
        return filtered_data['female_adult'].sum()
    elif category == '남자 중장년':
        return filtered_data['male_old'].sum()
    elif category == '여자 중장년':
        return filtered_data['female_old'].sum()
    else:
        return "카테고리가 잘못되었습니다."

# 최종적으로 질문을 처리하고 답변을 반환하는 함수
def process_question(question):
    date, category = extract_date_and_category_from_question(question)
    traffic_count = get_traffic_data_from_csv(date, category)
    return f"{date}의 {category} 수는 {traffic_count}명입니다."

# 예시 질문
question = "2024년 1월 1일 남자 청년의 수는 얼마인가?"
traffic_count_answer = process_question(question)
print(traffic_count_answer)
