import pandas as pd
import openai
import re
from dotenv import load_dotenv
import os

# .env 파일 로드
load_dotenv()

# .env에서 환경 변수 가져오기
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_DEPLOYMENT_NAME")

# OpenAI API 초기화
openai.api_type = "azure"
openai.api_base = AZURE_OPENAI_ENDPOINT
openai.api_version = "2024-08-01-preview"
openai.api_key = AZURE_OPENAI_KEY

# 현재 스크립트가 위치한 경로 가져오기
current_dir = os.path.dirname(os.path.abspath(__file__))

# CSV 파일 경로 설정
data_path = os.path.join(current_dir, 'monthly_data_with_date.csv')

# CSV 파일 로드
df = pd.read_csv(data_path)

# 질문을 처리하는 함수
def get_number_from_query(query):
    # 날짜와 카테고리 추출을 위한 정규 표현식
    date_pattern = r'(\d{4}-\d{2}-\d{2})'  # 날짜 (2024-01-01 형태)
    category_pattern = r'(남자 청년|여자 청년|남자 중장년|여자 중장년|남자 청소년 이하|여자 청소년 이하)'  # 카테고리 (남자 청년, 여자 청년 등)
    
    # 날짜와 카테고리 추출
    date_match = re.search(date_pattern, query)
    category_match = re.search(category_pattern, query)
    
    if date_match and category_match:
        date_str = date_match.group(1)
        category = category_match.group(1)
        
        # 데이터 필터링
        date_filtered_data = df[df['날짜'] == date_str]
        
        # 카테고리별 수치 계산
        if category == "남자 청년":
            result = date_filtered_data['남자 청년'].sum()
        elif category == "여자 청년":
            result = date_filtered_data['여자 청년'].sum()
        elif category == "남자 중장년":
            result = date_filtered_data['남자 중장년'].sum()
        elif category == "여자 중장년":
            result = date_filtered_data['여자 중장년'].sum()
        elif category == "남자 청소년 이하":
            result = date_filtered_data['남자 청소년 이하'].sum()
        elif category == "여자 청소년 이하":
            result = date_filtered_data['여자 청소년 이하'].sum()
        else:
            result = "해당 카테고리가 없습니다."
        
        return result
    else:
        return "날짜나 카테고리를 인식할 수 없습니다."

def generate_answer_with_number(query, number):
    # 사용자 질문을 바탕으로 모델 호출
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},  # 시스템 메시지 (모델의 역할 정의)
        {"role": "user", "content": query},  # 사용자 메시지 (사용자의 질문)
    ]
    
    # Azure OpenAI 모델 호출
    response = openai.ChatCompletion.create(
        engine=AZURE_DEPLOYMENT_NAME,  # Azure 배포 이름
        messages=messages,
        max_tokens=500,
        temperature=0.7,
    )
    
    # 모델의 응답 텍스트 반환
    answer = response['choices'][0]['message']['content'].strip()

    # CSV 데이터 계산 결과와 모델의 답변을 결합
    return f"{answer} 해당 날짜에 '{query}'의 수는 {number}명입니다."

# 질문 예시
user_query = "2024년 1월 1일 남자 청년의 수를 알려줘."
number = get_number_from_query(user_query)  # CSV에서 계산된 값

# OpenAI 모델 답변 생성
final_answer = generate_answer_with_number(user_query, number)

# 최종 답변 출력
print(final_answer)
