from azure.ai.search import SearchClient, SearchIndexClient
from azure.ai.search.models import *
from azure.core.credentials import AzureKeyCredential
import pandas as pd
import openai

# Azure Cognitive Search 설정
search_service_name = "your-search-service-name"  # Azure 검색 서비스 이름
index_name = "foot-traffic-index"  # 사용할 인덱스 이름
search_api_key = "your-search-api-key"  # Azure 검색 서비스 API 키

# OpenAI API 설정
openai.api_key = "your-openai-api-key"  # OpenAI API 키

# Azure Cognitive Search 엔드포인트 설정
endpoint = f"https://{search_service_name}.search.windows.net"

# 클라이언트 설정
index_client = SearchIndexClient(endpoint=endpoint, credential=AzureKeyCredential(search_api_key))
search_client = SearchClient(endpoint=endpoint, index_name=index_name, credential=AzureKeyCredential(search_api_key))

# 1. 인덱스 정의 및 생성
def create_index():
    fields = [
        SearchField(name="date", type=SearchFieldDataType.String, filterable=True, searchable=True),
        SearchField(name="time", type=SearchFieldDataType.String, filterable=True, searchable=True),
        SearchField(name="day_of_week", type=SearchFieldDataType.String, filterable=True, searchable=True),
        SearchField(name="young_men", type=SearchFieldDataType.Int32, filterable=False, searchable=False),
        SearchField(name="young_women", type=SearchFieldDataType.Int32, filterable=False, searchable=False),
        SearchField(name="middle_aged_men", type=SearchFieldDataType.Int32, filterable=False, searchable=False),
        SearchField(name="middle_aged_women", type=SearchFieldDataType.Int32, filterable=False, searchable=False),
        SearchField(name="youth_men", type=SearchFieldDataType.Int32, filterable=False, searchable=False),
        SearchField(name="youth_women", type=SearchFieldDataType.Int32, filterable=False, searchable=False),
    ]

    index = SearchIndex(name=index_name, fields=fields)
    index_client.create_index(index)

# 2. 데이터 업로드
def upload_data_to_search(csv_path):
    df = pd.read_csv(csv_path)  # CSV 파일 로드
    documents = []

    for _, row in df.iterrows():
        document = {
            "date": row['날짜'],
            "time": row['시간'],
            "day_of_week": row['요일'],
            "young_men": row['남자 청년'],
            "young_women": row['여자 청년'],
            "middle_aged_men": row['남자 중장년'],
            "middle_aged_women": row['여자 중장년'],
            "youth_men": row['남자 청소년 이하'],
            "youth_women": row['여자 청소년 이하']
        }
        documents.append(document)

    result = search_client.upload_documents(documents=documents)
    print(f"Uploaded {len(result)} documents.")

# 3. 사용자 질문 처리
def get_traffic_info(query):
    # 질문에서 날짜와 대상 추출
    date = "2024-01-01"  # 질문에서 추출한 날짜 (예: 질문 파싱 필요)
    category = "young_men"  # 질문에서 추출한 카테고리 (예: 질문 파싱 필요)

    # Azure Cognitive Search에서 데이터 검색
    search_results = search_client.search(search_text=date, top=100)

    # 검색된 데이터를 합산
    total_count = sum(result[category] for result in search_results)

    return f"{date}의 {category} 수는 {total_count}명입니다."

# 4. OpenAI를 통해 자연어 응답 생성
def get_openai_answer(query, raw_answer):
    prompt = f"질문: {query}\n답변: {raw_answer}\n\n자연스럽고 친근한 답변을 작성하세요."
    response = openai.Completion.create(
        model="text-davinci-003",
        prompt=prompt,
        temperature=0.7,
        max_tokens=100
    )
    return response.choices[0].text.strip()

# 5. 전체 프로세스 통합
def chatbot_response(query):
    # 5.1. Azure Search에서 데이터 검색 및 계산
    raw_answer = get_traffic_info(query)
    
    # 5.2. OpenAI를 사용한 자연어 답변 생성
    openai_answer = get_openai_answer(query, raw_answer)
    
    return openai_answer

# 실행 예시
if __name__ == "__main__":
    # 1. 인덱스 생성 (최초 1회 실행)
    create_index()

    # 2. 데이터 업로드
    csv_file_path = "foot_traffic_data.csv"  # CSV 파일 경로
    upload_data_to_search(csv_file_path)

    # 3. 질문 처리
    question = "2024년 1월 1일 남자 청년의 수를 알려줘."
    answer = chatbot_response(question)
    print(answer)
