import os
import openai
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from dotenv import load_dotenv
import re
from fastapi import FastAPI

app = FastAPI()

# .env 파일 로드
load_dotenv()

# Azure OpenAI 및 Azure AI Search 설정
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_key = os.getenv("AZURE_OPENAI_API_KEY")
openai.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2023-03-15-preview")
azure_openai_deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')

ai_search_api_key = os.getenv('AI_SEARCH_API_KEY')
ai_search_endpoint = os.getenv('AI_SEARCH_ENDPOINT')
ai_search_index = os.getenv('AI_SEARCH_INDEX')

# Azure Search 클라이언트 설정
search_client = SearchClient(
    endpoint=ai_search_endpoint,
    index_name=ai_search_index,
    credential=AzureKeyCredential(ai_search_api_key)
)

# 🔍 제목 추출 함수 (LLM에게 맡기기)
def extract_title_using_llm(question):
    prompt = f"""
    사용자로부터 받은 질문을 바탕으로, 질문에 적합한 제목을 추출해 주세요.
    질문: "{question}"

    추출된 제목을 제공해 주세요.
    """
    try:
        response = openai.ChatCompletion.create(
            deployment_id=azure_openai_deployment_name,
            messages=[
                {"role": "system", "content": "You are an AI that can extract relevant titles from questions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        return f"Error occurred while extracting title: {str(e)}"

# 🔍 키워드 추출 함수 (LLM에게 맡기기)
def extract_keywords_using_llm(question):
    prompt = f"""
    사용자로부터 받은 질문을 바탕으로, 가장 중요한 키워드를 추출해 주세요.
    질문: "{question}"

    추출된 키워드를 제공해 주세요.
    """
    try:
        response = openai.ChatCompletion.create(
            deployment_id=azure_openai_deployment_name,
            messages=[
                {"role": "system", "content": "You are an AI that can extract important keywords from questions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        return f"Error occurred while extracting keywords: {str(e)}"

# 🔎 AI Search 검색 함수
def search_in_ai_search(question):
    title = extract_title_using_llm(question)  # LLM을 사용해 제목을 추출
    keyword = extract_keywords_using_llm(question)  # LLM을 사용해 키워드를 추출

    # title과 keyword가 둘 다 있으면 결합하여 검색
    if title and keyword:
        search_query = f'title:"{title}" AND content:"{keyword}"'
    elif title:
        search_query = f'title:"{title}"'
    elif keyword:
        search_query = f'content:"{keyword}"'
    else:
        search_query = question

    try:
        results = search_client.search(search_query)
        result_texts = [result.get('content') for result in results if 'content' in result]
        return " ".join(result_texts) if result_texts else "No relevant information found."
    except Exception as e:
        return f"Error during search: {str(e)}"

# 💬 OpenAI 답변 생성 함수
def get_answer_from_openai(question, context):
    prompt = f"""
    너는 친절하고 이해하기 쉽게 설명하는 AI 챗봇이야.
    사용자의 질문에 대해 AI Search에서 가져온 데이터 소스의 내용만 참고하여 설명해줘.

    질문: "{question}"

    AI Search에서 가져온 데이터:
    {context}

    위의 데이터만 활용하여 사용자에게 자연스럽고 명확하게 설명해줘.  
    추가적인 정보나 추측 없이, AI Search의 결과를 기반으로 답변을 구성해줘.
"""

    try:
        response = openai.ChatCompletion.create(
            deployment_id=azure_openai_deployment_name,
            messages=[ 
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        return f"Error occurred while generating response: {str(e)}"

# 🧠 챗봇 응답 함수
@app.post("/chatbot")
def chatbot_response(question):
    context = search_in_ai_search(question)
    if context == "No relevant information found.":
        return "제가 해당 질문에 대한 정보를 찾지 못했습니다. 다른 질문을 시도해 주세요!"
    return get_answer_from_openai(question, context)

# 🚀 챗봇 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8700)
    # print("Welcome to the chatbot! Type 'exit' to quit.")
    # while True:
    #     user_input = input("Ask a question: ")
    #     if user_input.lower() == 'exit':
    #         print("Goodbye!")
    #         break
    #     response = chatbot_response(user_input)
    #     print("\n🤖 Bot Answer:", response)
