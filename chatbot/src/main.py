import os
import openai
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

# # CORS 설정
# origins = [
#     "http://localhost:5173",  # 개발 중인 Vite/React 등 프론트엔드 주소
#     "https://msteam5iseeu.ddns.net",
#     # 필요한 다른 출처(도메인+포트)를 추가
# ]

# # CORS 추가
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,       # 운영에선 구체적으로 지정!
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# .env 파일 로드
load_dotenv()

# Azure OpenAI 및 Azure AI Search 설정
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_key = os.getenv("AZURE_OPENAI_API_KEY")
openai.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
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

# 🔎 LLM을 사용하여 키워드 추출 함수
def extract_keywords(question):
    try:
        response = openai.ChatCompletion.create(
            deployment_id=azure_openai_deployment_name,
            messages=[ 
                {"role": "system", "content": "Extract the most relevant keywords from the user's question."},
                {"role": "user", "content": f"Question: {question}\nExtracted Keywords:"}
            ],
            max_tokens=50
        )
        keywords = response.choices[0].message['content'].strip()
        return keywords
    except Exception as e:
        return f"Error extracting keywords: {str(e)}"

# 🔎 AI Search 검색 함수 (키워드 기반 검색)
def search_in_ai_search(question):
    try:
        # LLM을 이용해 질문에서 키워드 추출
        keywords = extract_keywords(question)
        print(f"🔍 Extracted Keywords: {keywords}")  # 디버깅용 출력

        # AI Search에서 유사한 내용을 검색
        search_query = f"{keywords}"  # 키워드를 기반으로 검색
        results = search_client.search(search_query)

        result_texts = [result.get('content') for result in results if 'content' in result]
        return " ".join(result_texts) if result_texts else "No relevant information found."
    except Exception as e:
        return f"Error during search: {str(e)}"

# 💬 OpenAI 답변 생성 함수
def get_answer_from_openai(question, context):
    prompt = f"""
        너는 AI Search에서 제공된 데이터만을 기반으로 사용자의 질문에 답변하고, 적절한 정책과 사업을 추천하는 AI 챗봇이야.  
        사용자의 질문 속에 포함된 정보를 고려하여 AI Search에서 가져온 데이터 중 가장 적합한 내용을 찾아 설명해줘.  

        🔹 **사용자 질문:** "{question}"  

        🔹 **AI Search에서 가져온 데이터:**  
        {context}  

        ⚠️ **중요:**  
        👉 **반드시 위의 데이터만 활용하여** 사용자에게 자연스럽고 명확하게 답변해줘.  
        👉 **추가적인 정보, 외부 지식, 추측을 포함하지 마.**  
        👉 **AI Search에서 제공된 데이터를 빠짐없이 전달하고, 중요한 정보를 정리해서 알려줘.**  
        👉 **단, "중소기업"과 관련된 내용은 절대 제공하지 마.**  
        👉 **"중소기업"이라는 단어가 포함된 내용이 있다면 답변에서 제외하고 제공해.**  
        👉 사람이 전달하는 것처럼 부드럽고 이해하기 쉽게 설명해줘.  
        👉 사용자의 질문에 대한 답변을 먼저 제공한 후, 관련된 정책이 있다면 함께 안내해줘.  

        📌 **답변 형식 예시**  
        - "질문하신 내용에 대한 답변은 다음과 같습니다."    
        - "이 정책의 주요 지원 내용은 다음과 같습니다: ..."  
        - "추가로 궁금한 점이 있으면 언제든지 질문해주세요!"  
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
@app.post("/ask")
def chatbot_response(question):
    context = search_in_ai_search(question)
    if context == "No relevant information found.":
        return "해당 질문에 대한 정보를 찾지 못했습니다. 추가적인 세부 사항을 제공해 주시겠어요?"

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
