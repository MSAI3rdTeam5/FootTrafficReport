import os
from dotenv import load_dotenv
import openai
import re
from langchain_community.vectorstores import AzureSearch
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.chat_models import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage


# 환경 변수 로드
load_dotenv()

# OpenAI API 설정
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_version = "2024-08-01-preview"
openai.api_key = os.getenv("AZURE_OPENAI_KEY")

AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME")
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")

# Embedding 모델 설정
embedding_function = OpenAIEmbeddings(
    deployment=os.getenv("AZURE_EMBEDDING_DEPLOYMENT_NAME"),  # embedding 모델 배포 이름 사용
    openai_api_key=openai.api_key
)




# AzureSearch 설정
retriever = AzureSearch(
    index_name="foot-index",
    azure_search_endpoint=AZURE_SEARCH_ENDPOINT,
    azure_search_key=AZURE_SEARCH_KEY,
    embedding_function=embedding_function
)

# 질문 분석 함수
def process_question(question):
    # 날짜 추출
    date = re.search(r'\d{4}-\d{2}-\d{2}', question)

    # 시간 추출
    time = re.search(r'\d{1,2}(시|:\d{2})', question)

    # 성별 추출
    gender = None
    if "남자" in question:
        gender = "male"
    elif "여자" in question:
        gender = "female"

    # 연령대 추출
    age_group = None
    if "청년" in question:
        age_group = "young"
    elif "성인" in question:
        age_group = "adult"
    elif "노인" in question:
        age_group = "old"

    return {
        "date": date.group(0) if date else None,
        "time": time.group(0).replace("시", ":00") if time else None,
        "gender": gender,
        "age_group": age_group
    }

# 데이터 요청 함수
def query_data_from_ai_search(question_details):
    column = f"{question_details['gender']}_{question_details['age_group']}"

    # 질문 템플릿
    query_template = """
    데이터베이스에서 다음 조건에 맞는 데이터를 검색하세요:
    날짜: {date}
    시간: {time}
    성별 및 연령대: {column}

    결과가 없으면 "관련 데이터를 찾을 수 없습니다."라고 반환하세요.
    """
    query_prompt = PromptTemplate.from_template(query_template)

    query = query_prompt.format(
        date=question_details.get("date", "제공되지 않음"),
        time=question_details.get("time", "제공되지 않음"),
        column=column
    )

    # 데이터 검색
    results = retriever.get_relevant_documents(query)
    if not results:
        return "관련 데이터를 찾을 수 없습니다."
    return results

# GPT 응답 생성 함수
def generate_response_from_gpt(question, result):
    chat_model = AzureChatOpenAI(
        deployment_name=AZURE_DEPLOYMENT_NAME,
        temperature=0,
        openai_api_key=openai.api_key
    )

    prompt = f"""
    너는 데이터 분석 챗봇이야. 사용자가 질문한 내용을 데이터로 분석해 답변해줘.

    질문: {question}

    결과:
    {result if result else "관련 데이터를 찾을 수 없습니다."}

    답변을 자연스럽고 친절하게 작성해줘.
    """

    response = chat_model([HumanMessage(content=prompt)])
    return response.content

# 전체 처리 함수
def chatbot_response(question):
    question_details = process_question(question)
    result = query_data_from_ai_search(question_details)
    return generate_response_from_gpt(question, result)

# 사용자 입력 처리
if __name__ == "__main__":
    print("안녕하세요! 데이터 분석 챗봇입니다. 질문을 입력해주세요.")
    while True:
        user_question = input("질문: ")
        if user_question.lower() in ["exit", "quit", "종료"]:
            print("챗봇을 종료합니다. 이용해주셔서 감사합니다!")
            break
        try:
            response = chatbot_response(user_question)
            print(f"답변: {response}")
        except Exception as e:
            print(f"오류가 발생했습니다: {e}")
