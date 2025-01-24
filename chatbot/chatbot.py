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

# 요일 매핑
day_mapping = {
    "월요일": "월", "화요일": "화", "수요일": "수",
    "목요일": "목", "금요일": "금", "토요일": "토", "일요일": "일"
}

# 날짜 및 요일 변환 함수
def convert_date_format(question: str) -> str:
    date_match = re.search(r"(\d{4})년\s?(\d{1,2})월\s?(\d{1,2})일", question)
    if date_match:
        year, month, day = date_match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"
    return None

def extract_conditions(question: str) -> dict:
    date = convert_date_format(question)

    day_match = re.search(r"(월요일|화요일|수요일|목요일|금요일|토요일|일요일)", question)
    day = day_mapping[day_match.group()] if day_match else None

    time_match = re.search(r"(\d{1,2})시\s?(\d{1,2})?분", question)
    time = f"{int(time_match.group(1)):02d}:{int(time_match.group(2) or 0):02d}" if time_match else None

    targets = ["남자 청년", "여자 청년", "남자 중장년", "여자 중장년", "남자 청소년 이하", "여자 청소년 이하"]
    target_match = [target for target in targets if target in question]
    target = target_match[0] if target_match else None

    return {"date": date, "day": day, "time": time, "target": target}

def filter_data(conditions: dict) -> pd.DataFrame:
    filtered_data = df.copy()

    # 날짜 필터링
    if conditions["date"]:
        filtered_data = filtered_data[filtered_data["날짜"] == conditions["date"]]

    # 요일 필터링
    if conditions["day"]:
        filtered_data = filtered_data[filtered_data["요일"] == conditions["day"]]

    # 시간이 없을 경우 하루 전체 데이터 유지
    if not conditions["time"]:
        conditions["time"] = "하루 전체"
    else:
        filtered_data = filtered_data[filtered_data["시간"] == conditions["time"]]

    # 대상 필터링
    if conditions["target"] and conditions["target"] in filtered_data.columns:
        filtered_data = filtered_data[["날짜", "시간", "요일", conditions["target"]]]
    else:
        return pd.DataFrame()

    return filtered_data

def generate_response(question: str, filtered_data: pd.DataFrame, conditions: dict, messages: list) -> str:
    # 조건 부족 시 명확한 피드백 제공
    if not conditions["date"] and not conditions["day"] and not conditions["time"] and not conditions["target"]:
        return (
            "질문에서 유효한 조건을 찾을 수 없습니다. 예를 들어, "
            "'2024년 1월 1일 0시 남자 청년의 유동인구를 알려줘'처럼 질문에 날짜, 시간, 대상을 포함해주세요."
        )

    # 필터링 결과가 비어 있을 경우 메시지 제공
    if filtered_data.empty:
        return (
            f"'{conditions['date']}'의 '{conditions['time']}'에 '{conditions['target']}' 데이터가 없습니다. "
            "질문을 다시 확인하거나 조건을 수정해 주세요."
        )

    # 유동인구 데이터 계산
    try:
        total_traffic = filtered_data[conditions["target"]].sum()
        avg_traffic = filtered_data[conditions["target"]].mean()
    except KeyError:
        return f"'{conditions['target']}'에 해당하는 데이터가 존재하지 않습니다. 질문을 확인해주세요."

    # 메시지 히스토리 업데이트
    messages.append({"role": "user", "content": question})
    messages.append({
        "role": "assistant",
        "content": (
            f"'{conditions['date']}'의 '{conditions['time']}'에 '{conditions['target']}'의 총 유동인구는 {total_traffic}이며, "
            f"평균 유동인구는 {avg_traffic:.2f}입니다."
        ),
    })

    # LLM 호출
    response = openai.ChatCompletion.create(
        engine=AZURE_DEPLOYMENT_NAME,
        messages=messages,
        max_tokens=500,
        temperature=0.7,
    )

    # LLM 응답 추가
    messages.append({"role": "assistant", "content": response["choices"][0]["message"]["content"]})

    return response["choices"][0]["message"]["content"]

# 메인 실행 흐름
def main():
    messages = [
        {"role": "system", "content": "You are a helpful assistant who analyzes traffic data and provides insights."}
    ]

    while True:
        question = input("질문을 입력하세요 (종료하려면 '종료' 입력): ")
        if question.lower() == "종료":
            print("대화를 종료합니다.")
            break

        conditions = extract_conditions(question)
        filtered_data = filter_data(conditions)
        answer = generate_response(question, filtered_data, conditions, messages)

        print("\n[응답]")
        print(answer)

if __name__ == "__main__":
    main()
