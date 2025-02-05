import openai
import os
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# OpenAI API 설정
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_version = "2024-08-01-preview"
openai.api_key = os.getenv("AZURE_OPENAI_KEY")

# Azure Search 설정
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

# 검색 질의 함수
def search_data(query):
    results = search_client.search(query)
    documents = []
    for result in results:
        documents.append(result)  # 검색된 문서들을 리스트에 추가
    return documents

# OpenAI GPT 모델로 답변 생성 함수
def generate_answer(query, documents):
    # 검색된 데이터를 GPT에게 전달하여 답변 생성
    context = "\n".join([f"날짜: {doc['date']}, 시간: {doc['time']}, 요일: {doc['day_of_week']}, 남자 성인: {doc['male_adult']}, 여자 성인: {doc['female_adult']}, 남자 노인: {doc['male_old']}, 여자 노인: {doc['female_old']}, 남자 청년: {doc['male_young']}, 여자 청년: {doc['female_young']}" for doc in documents])  # 문서들의 내용 합치기
    prompt = f"다음 정보들을 바탕으로 질문에 답해 주세요:\n{context}\n질문: {query}\n답변:"

    response = openai.Completion.create(
        engine=AZURE_DEPLOYMENT_NAME,
        prompt=prompt,
        max_tokens=200,
        temperature=0.7
    )

    return response.choices[0].text.strip()

# 챗봇 함수
def chatbot(query):
    # Azure Search에서 질문에 대한 관련 정보 검색
    documents = search_data(query)
    
    # 관련된 정보가 있다면 GPT-4를 통해 답변 생성
    if documents:
        answer = generate_answer(query, documents)
        return answer
    else:
        return "죄송합니다, 해당 질문에 대한 답변을 찾을 수 없습니다."

# 사용자가 질문하는 예시
user_query = "2024-01-01 male_young 수를 알려줘."
answer = chatbot(user_query)
print("챗봇 답변:", answer)
