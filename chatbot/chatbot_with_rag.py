import os
import openai
from azure.search.documents import SearchClient
from azure.search.documents.models import QueryType
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential

# .env 파일에서 환경 변수 로드
load_dotenv()

# Azure Cognitive Search 정보
SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
INDEX_NAME = os.getenv("AZURE_INDEX_NAME")

# OpenAI API 정보
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME")

# Azure Cognitive Search 클라이언트 초기화
search_client = SearchClient(
    endpoint=SEARCH_ENDPOINT, 
    index_name=INDEX_NAME, 
    credential=AzureKeyCredential(SEARCH_KEY)  # API 키를 AzureKeyCredential로 전달
)

# OpenAI GPT 초기화
openai.api_type = "azure"
openai.api_base = AZURE_OPENAI_ENDPOINT
openai.api_version = "2024-08-01-preview"
openai.api_key = AZURE_OPENAI_KEY

# 검색 함수
def search_cognitive_search(query):
    results = search_client.search(query, query_type=QueryType.SIMPLE)
    documents = [doc for doc in results]  # results에서 직접 반복문을 사용하여 접근
    return documents

# OpenAI GPT 답변 생성 함수
def generate_answer(prompt):
    response = openai.ChatCompletion.create(
        deployment_id=AZURE_DEPLOYMENT_NAME,  # Azure에서 사용하는 deployment_id
        messages=[{"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": prompt}],
        max_tokens=2000
    )
    return response['choices'][0]['message']['content'].strip()  # 답변 내용 추출

# 사용자 질문 처리 함수
def handle_question(question):
    # Azure Cognitive Search에서 검색
    search_results = search_cognitive_search(question)
    
    # 검색 결과를 텍스트로 변환
    context = "\n".join([str(result) for result in search_results])
    
    # GPT-4에 전달할 프롬프트 생성
    prompt = f"""
    다음은 데이터에서 검색한 결과입니다:
    {context}
    
    사용자의 질문에 답변하세요:
    {question}
    """
    # OpenAI를 사용하여 답변 생성
    answer = generate_answer(prompt)
    return answer

# 실행
if __name__ == "__main__":
    while True:
        user_input = input("질문: ")
        if user_input.lower() == "종료":
            print("챗봇을 종료합니다.")
            break
        response = handle_question(user_input)
        print(f"답변: {response}")
