import pandas as pd
import re
import openai
import os
from dotenv import load_dotenv

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

print(f"CSV 파일 경로: {data_path}")

# 질문에서 조건 추출 함수
def extract_conditions(question: str) -> dict:
    """
    질문에서 조건(요일, 시간, 대상)을 동적으로 추출.
    """
    # 요일 추출
    days = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]
    day_match = [day for day in days if day in question]
    day = day_match[0] if day_match else None

    # 시간 범위 추출
    time_match = re.search(r"(\d{1,2})시(\d{2})?부터\s(\d{1,2})시(\d{2})?", question)
    if time_match:
        start_time = f"{time_match.group(1)}:{time_match.group(2) if time_match.group(2) else '00'}"
        end_time = f"{time_match.group(3)}:{time_match.group(4) if time_match.group(4) else '00'}"
    else:
        start_time = end_time = None

    # 대상 추출
    targets = ["남자 청소년 이하", "여자 청소년 이하", "남자 중년", "여자 중년", "남자 청년", "여자 청년", "남자 중장년", "여자 중장년"]
    target_match = [target for target in targets if target in question]
    target = target_match[0] if target_match else None

    return {"day": day, "start_time": start_time, "end_time": end_time, "target": target}

# 데이터 필터링 함수
def filter_data(conditions: dict) -> pd.DataFrame:
    """
    조건에 따라 데이터를 필터링.
    """
    filtered_data = df.copy()

    # 요일 필터링
    if conditions["day"]:
        filtered_data = filtered_data[filtered_data["요일"] == conditions["day"]]

    # 시간 필터링
    if conditions["start_time"] and conditions["end_time"]:
        filtered_data = filtered_data[
            (filtered_data["시간"] >= conditions["start_time"])
            & (filtered_data["시간"] <= conditions["end_time"])
        ]

    # 대상 필터링
    if conditions["target"]:
        filtered_data = filtered_data[["날짜", "시간", "요일", conditions["target"]]]

    return filtered_data

# GPT를 사용한 답변 생성
def generate_response(question: str, filtered_data: pd.DataFrame) -> str:
    """
    GPT-4를 호출하여 자연어 응답 생성.
    """
    if filtered_data.empty:
        return "조건에 맞는 데이터가 없습니다. 다른 질문을 시도해 보세요."

    # 데이터를 요약된 텍스트로 변환
    data_summary = filtered_data.to_string(index=False)

    # GPT-4 API 호출
    prompt = f"""
    사용자가 다음과 같은 질문을 했습니다: "{question}"
    관련 데이터를 검색한 결과는 다음과 같습니다:
    {data_summary}

    위 데이터를 기반으로 사용자에게 유용한 정보를 제공해주세요.
    """
    response = openai.Completion.create(
        engine=AZURE_DEPLOYMENT_NAME,
        prompt=prompt,
        max_tokens=500,
        temperature=0.7,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
    )
    return response["choices"][0]["text"].strip()

# 메인 실행 흐름
def main():
    # 사용자 질문 입력
    question = input("질문을 입력하세요: ")

    # 조건 추출
    conditions = extract_conditions(question)

    # 데이터 필터링
    filtered_data = filter_data(conditions)

    # GPT-4를 통해 자연어 응답 생성
    answer = generate_response(question, filtered_data)
    print("\n[응답]")
    print(answer)

if __name__ == "__main__":
    main()
