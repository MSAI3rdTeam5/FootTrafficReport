import openai
import os
import re
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

AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME")
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
AZURE_INDEX_NAME = os.getenv("AZURE_INDEX_NAME")

# Azure Cognitive Search 클라이언트 초기화
search_client = SearchClient(
    endpoint=AZURE_SEARCH_ENDPOINT,
    index_name=AZURE_INDEX_NAME,
    credential=AzureKeyCredential(AZURE_SEARCH_KEY)
)

# OpenAI로 사용자의 질문에서 의도를 추출하는 함수
def extract_intent(question):
    response = openai.ChatCompletion.create(
        engine=AZURE_DEPLOYMENT_NAME,  # Azure에서 사용 중인 GPT-4 모델의 배포 이름
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
        top=1000  # 조건에 맞는 모든 결과를 추출
    )

    data = []
    # 검색 결과가 있다면 해당 데이터 리스트에 추가
    for result in search_results:
        data.append(result)
    
    return data

# 특정 조건에 맞는 데이터를 기반으로 합산 및 계산
def calculate_data(data, gender, age_group):
    total = 0
    for record in data:
        if gender == "남자" and age_group == "청년":
            total += record.get('male_young', 0)
        elif gender == "여자" and age_group == "청년":
            total += record.get('female_young', 0)
        elif gender == "남자" and age_group == "중년":
            total += record.get('male_adult', 0)
        elif gender == "여자" and age_group == "중년":
            total += record.get('female_adult', 0)
        elif gender == "남자" and age_group == "중장년":
            total += record.get('male_old', 0)
        elif gender == "여자" and age_group == "중장년":
            total += record.get('female_old', 0)
    
    return total

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
        
        # Azure Cognitive Search에서 데이터를 조회
        data = search_data_from_csv(date, gender, age_group)
        
        if not data:
            print("해당하는 데이터가 없습니다.")
            continue
        
        # 조회된 데이터를 기반으로 합산 계산
        total = calculate_data(data, gender, age_group)
        
        # 결과 출력
        print(f"{date} {gender} {age_group}의 총합은 {total}명입니다.")

# 챗봇 시작
if __name__ == "__main__":
    chatbot()