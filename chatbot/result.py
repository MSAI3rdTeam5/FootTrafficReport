import os
import openai
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# Azure OpenAI 및 Azure AI Search 관련 환경 변수 로드
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

# Azure AI Search에서 검색하기
def search_in_ai_search(query):
    try:
        results = search_client.search(query)
        result_texts = [result['content'] for result in results]
        if result_texts:
            return " ".join(result_texts)  # 검색된 텍스트만 반환
        else:
            return "No relevant information found."
    except Exception as e:
        return f"Error occurred during search: {str(e)}"

def create_prompt_from_search_result(question, context):
    """
    질문과 검색된 내용을 바탕으로 프롬프트를 작성합니다.
    이 프롬프트는 OpenAI 모델에게 답변을 어떻게 생성해야 하는지 알려줍니다.
    """
    prompt = f"""
    너는 매우 친절하고 상세하게 설명하는 인공지능 챗봇이다.
    사용자가 질문을 하면 그에 대한 답을 텍스트 형식으로 자세히 설명해준다.
    네가 설명하는 방식은 간단한 정보 제공뿐만 아니라 배경 지식과 관련된 세부적인 사항들까지 포함해야 한다.

    사용자가 질문한 내용은 다음과 같다:
    질문: "{question}"

    AI Search 결과는 다음과 같다:
    {context}

    너는 위의 내용을 바탕으로 친절하고 자세하게 설명해줘. 가능한 한 많은 배경 정보와 관련된 세부 사항도 추가해야 한다.
    """
    return prompt

def chatbot_response(question):
    # AI Search 결과만 사용하여 답변 생성
    context = search_in_ai_search(question)
    
    # 검색된 결과를 바탕으로 프롬프트 작성
    if context != "No relevant information found.":
        prompt = create_prompt_from_search_result(question, context)
        
        # OpenAI API 호출
        try:
            response = openai.ChatCompletion.create(
                deployment_id=azure_openai_deployment_name,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": question}
                ],
                max_tokens=1500
            )
            return response.choices[0].message['content'].strip()  # 모델의 응답 반환
        except Exception as e:
            return f"Error occurred while generating response: {str(e)}"
    else:
        return "저는 이 질문에 대한 정보를 찾을 수 없습니다. 다른 질문을 해 주세요!"


# 챗봇 실행
if __name__ == "__main__":
    print("Welcome to the chatbot! Type 'exit' to quit.")
    while True:
        question = input("Ask a question: ")
        if question.lower() == 'exit':
            print("Goodbye!")
            break
        response = chatbot_response(question)
        print("Bot Answer:", response)
