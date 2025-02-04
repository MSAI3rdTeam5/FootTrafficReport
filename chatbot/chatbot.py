import openai
import os
import re
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수에서 Azure API와 OpenAI 키 불러오기
openai.api_key = os.getenv('AZURE_OPENAI_KEY')  # OpenAI API 키
search_endpoint = os.getenv('AZURE_SEARCH_ENDPOINT')  # Azure Search 엔드포인트
search_api_key = os.getenv('AZURE_SEARCH_KEY')  # Azure Search API 키
index_name = os.getenv('AZURE_INDEX_NAME')  # Azure Cognitive Search에서 사용하는 인덱스 이름

# Azure Cognitive Search 클라이언트 초기화
search_client = SearchClient(endpoint=search_endpoint,
                             index_name=index_name,
                             credential=AzureKeyCredential(search_api_key))

# OpenAI로 사용자의 질문에서 의도를 추출하는 함수
def extract_intent(question):
    response = openai.ChatCompletion.create(
        model="gpt-4",  # GPT-4 모델 사용
        messages=[{"role": "system", "content": "사용자가 질문을 통해 원하는 데이터를 추출해줘."},
                  {"role": "user", "content": question}],
        max_tokens=1000
    )
    return response['choices'][0]['message']['content'].strip()

# 의도에서 날짜, 성별, 연령대 추출
def extract_date_gender_age(intent):
    date_pattern = r"\d{4}-\d{2}-\d{2}"  # "YYYY-MM-DD" 형식
    date = re.search(date_pattern, intent)
    date = date.group(0) if date else None
    
    gender = "남자" if "남자" in intent else "여자" if "여자" in intent else None
    age_group = "청년" if "청년" in intent else "중년" if "중년" in intent else "중장년" if "중장년" in intent else None
    
    return date, gender, age_group

# 사용자 질문을 분석하고 Azure Cognitive Search에서 데이터를 조회하는 함수
def search_data_from_csv(date, gender, age_group):
    # Azure Cognitive Search에서 해당 조건에 맞는 데이터 검색
    search_results = search_client.search(
        search_text=f"date:{date} gender:{gender} age_group:{age_group}",
        top=1  # 결과 상위 1개만 추출
    )

    # 검색 결과가 있다면 해당 데이터 반환
    for result in search_results:
        if gender == "남자" and age_group == "청년":
            return f"{date} {gender} {age_group}의 수: {result['male_young']}"
        elif gender == "여자" and age_group == "청년":
            return f"{date} {gender} {age_group}의 수: {result['female_young']}"
        elif gender == "남자" and age_group == "중년":
            return f"{date} {gender} {age_group}의 수: {result['male_adult']}"
        elif gender == "여자" and age_group == "중년":
            return f"{date} {gender} {age_group}의 수: {result['female_adult']}"
        elif gender == "남자" and age_group == "중장년":
            return f"{date} {gender} {age_group}의 수: {result['male_old']}"
        elif gender == "여자" and age_group == "중장년":
            return f"{date} {gender} {age_group}의 수: {result['female_old']}"

    return "데이터를 찾을 수 없습니다."

# 챗봇 대화형 함수
def chatbot():
    print("안녕하세요! 챗봇입니다. 질문을 입력해주세요.")
    
    while True:
        # 사용자 질문 받기
        question = input("질문: ")
        
        if question.lower() in ['exit', 'quit', '종료']:
            print("챗봇을 종료합니다. 감사합니다!")
            break
        
        # OpenAI로 사용자의 질문에서 의도 추출
        intent = extract_intent(question)
        print(f"사용자의 의도: {intent}")
        
        # 의도에서 날짜, 성별, 연령대 추출
        date, gender, age_group = extract_date_gender_age(intent)
        
        # 날짜, 성별, 연령대가 모두 추출되지 않으면 에러 메시지 반환
        if not date or not gender or not age_group:
            print("날짜, 성별, 연령대 정보를 정확하게 입력해주세요.")
            continue
        
        # Azure Cognitive Search에서 데이터를 조회하고 결과 출력
        answer = search_data_from_csv(date, gender, age_group)
        print(answer)

# 챗봇 시작
if __name__ == "__main__":
    chatbot()
