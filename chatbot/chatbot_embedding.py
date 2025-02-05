from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
import openai
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# OpenAI API 설정
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_version = "2024-08-01-preview"
openai.api_key = os.getenv("AZURE_OPENAI_KEY")

# Azure Cognitive Search 클라이언트 설정
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME")
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")

# SearchClient 객체 생성 (Azure Cognitive Search)
search_client = SearchClient(
    endpoint=AZURE_SEARCH_ENDPOINT,
    index_name=os.getenv("AZURE_INDEX_NAME"),
    credential=AzureKeyCredential(AZURE_SEARCH_KEY)
)

# 사용자가 입력한 질문을 바탕으로 데이터를 검색하는 함수
def search_related_data(question):
    # 예시로 사용자의 질문을 기반으로 날짜와 시간대 조건을 추출
    gender_condition = None
    date_condition = None
    time_condition = None
    
    # 날짜와 성별 조건 추출
    if "남자 청년" in question:
        gender_condition = "male_young"
    elif "여자 청년" in question:
        gender_condition = "female_young"
    
    if "2024년 1월 1일" in question:
        date_condition = "date eq '2024-01-01'"
    
    if "14:00-17:00" in question:
        time_condition = "time eq '14:00-17:00'"

    # 필터 조건 작성
    filters = []
    if date_condition:
        filters.append(date_condition)
    if time_condition:
        filters.append(time_condition)
    if gender_condition:
        filters.append(f"{gender_condition} ge 0")  # 성별에 해당하는 값이 존재하는지 확인
    
    filter_condition = " and ".join(filters) if filters else None
    
    # 검색 쿼리 (질문을 그대로 사용)
    query = " ".join([word for word in question.split() if word not in ["남자 청년", "여자 청년", "2024년 1월 1일", "14:00-17:00"]])

    # 결과를 검색
    results = search_client.search(query, filter=filter_condition)

    # 결과 출력
    found_results = list(results)  # results는 lazy iterator이므로 list로 변환하여 사용
    if found_results:
        for result in found_results:
            print(f"날짜: {result['date']}, 시간: {result['time']}, 남자 청년: {result['male_young']}, 여자 청년: {result['female_young']}")
    else:
        print("검색 결과가 없습니다.")

# 예시 질문 입력
question = "2024-01-01 남자 청년의 수를 알려줘."
search_related_data(question)
