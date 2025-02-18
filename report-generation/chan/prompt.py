import os  
from openai import AzureOpenAI
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import openai  
from dotenv import load_dotenv
import time
from datetime import datetime
import numpy as np

load_dotenv()

#여성 가중치 데이터 활용
data_file = "Female_weight.csv" 
data = pd.read_csv(data_file)

endpoint = os.getenv("ENDPOINT_URL")
deployment = os.getenv("DEPLOYMENT_NAME")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY")   

# Initialize Azure OpenAI Service client with key-based authentication    
client = AzureOpenAI(  
    azure_endpoint=endpoint,  
    api_key=subscription_key,  
    api_version="2024-05-01-preview",
)


#데이터 전처리 과정(현재는 시뮬레이션 데이터 활용 중)
#아래 데이터 전처리는 요일, 연령대, 성별, 시간대별 유동인구 합계를 구하는 과정
def process_data(data, start_date, end_date):
   
    data["날짜"] = pd.to_datetime(data["날짜"])  
    filtered_data = data[(data["날짜"] >= start_date) & (data["날짜"] <= end_date)]
    
    weekday_order = ["월", "화", "수", "목", "금", "토", "일"]
    age_columns = ["남자 청년", "여자 청년", "남자 중장년", "여자 중장년", "남자 청소년 이하", "여자 청소년 이하"]
    
    weekday_means = filtered_data.groupby("요일")[age_columns].sum().sum(axis=1)
    weekday_means = weekday_means[weekday_order]
    
    age_means = filtered_data[age_columns].sum()

    male_columns = [col for col in filtered_data.columns if col.startswith("남")]
    female_columns = [col for col in filtered_data.columns if col.startswith("여")]
    male_values = filtered_data[male_columns].sum()
    female_values = filtered_data[female_columns].sum()

    time_means = filtered_data.groupby("시간")[age_columns].sum().sum(axis=1)
    
    processed_data = {
        "weekday_means": weekday_means.to_dict(),
        "age_means": age_means.to_dict(),
        "male_values": male_values.to_dict(),
        "female_values": female_values.to_dict(),
        "time_means": time_means.to_dict()
    }
    
    return processed_data

#폰트 설정(맑은 고딕체)
def set_korean_font():
    plt.rcParams["font.family"] = "Malgun Gothic"
    plt.rcParams["axes.unicode_minus"] = False

set_korean_font()



def filter_data_by_date(data, start_date, end_date):
    
    data['날짜'] = pd.to_datetime(data['날짜'])
    filtered_data = data[(data['날짜'] >= start_date) & (data['날짜'] <= end_date)]
    
    return filtered_data


def save_with_unique_name(folder, base_name, ext=".png"):

    if not os.path.exists(folder):
        os.makedirs(folder)  # 폴더가 없으면 생성
    timestamp = int(time.time())
    return os.path.join(folder, f"{base_name}_{timestamp}{ext}")

def create_visualizations(data, start_date=None, end_date=None):
    graph_paths = []
    data_folder = "data_graph"

    if start_date and end_date:
        data = filter_data_by_date(data, start_date, end_date)
    else:
        print('입력오류')
        
    age_columns = ["남자 청년", "여자 청년", "남자 중장년", "여자 중장년", "남자 청소년 이하", "여자 청소년 이하"]
    
    # 요일별 유동인구
    weekday_order = ["월", "화", "수", "목", "금", "토", "일"]
    data['요일'] = pd.Categorical(data['요일'], categories=weekday_order, ordered=True)
    plt.figure(figsize=(10, 6))
    weekday_values = data.groupby("요일")[age_columns].sum() / 1000  # 천 명 단위로 변환
    weekday_values_total = weekday_values.sum(axis=1)
    bars = weekday_values_total.plot(kind="bar", color="purple")
    plt.title("요일별 유동인구 (합계, 천 명)")
    plt.ylabel("유동인구 (천 명)")
    plt.xlabel("요일")
    plt.xticks(rotation=0) 
    plt.tight_layout()

    for bar in bars.patches:
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.1, f'{bar.get_height():,.0f}', 
                ha='center', va='bottom', fontsize=10)

    weekday_graph_path = save_with_unique_name(data_folder, "weekday_values")
    plt.savefig(weekday_graph_path)
    plt.close()
    graph_paths.append(weekday_graph_path)

    # 연령별 유동인구
    plt.figure(figsize=(10, 6))
    age_values = data[age_columns].sum() / 1000  
    bars = age_values.plot(kind="bar", color=["skyblue", "pink", "blue", "lightcoral", "green", "lightgreen"])
    plt.title("연령별 유동인구 (합계, 천 명)")
    plt.ylabel("유동인구 (천 명)")
    plt.xticks(rotation=0)
    plt.tight_layout()
    for bar in bars.patches:
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.1, f'{bar.get_height():,.0f}', 
                ha='center', va='bottom', fontsize=10)

    age_graph_path = save_with_unique_name(data_folder, "age_group_values")
    plt.savefig(age_graph_path)
    plt.close()
    graph_paths.append(age_graph_path)

    # 성별 유동인구 그래프
    male_columns = [col for col in data.columns if col.startswith("남")]
    female_columns = [col for col in data.columns if col.startswith("여")]

    male_values = data[male_columns].sum().sum() / 1000  
    female_values = data[female_columns].sum().sum() / 1000  
    gender_values = [male_values, female_values]
    labels = ["남성", "여성"]
    colors = ["skyblue", "pink"]

    plt.figure(figsize=(8, 8))
    wedges, texts, autotexts = plt.pie(
        gender_values, 
        labels=None,  
        autopct=lambda pct: f"{pct:.1f}%\n({(pct / 100 * sum(gender_values)):.1f}천 명)", 
        colors=colors, 
        startangle=90, 
        textprops={'color': "black", 'fontsize': 12}
    )

    for i, label in enumerate(labels):
        x, y = wedges[i].center  
        angle = (wedges[i].theta2 + wedges[i].theta1) / 2  
        x = 0.6 * wedges[i].r * np.cos(np.radians(angle))  
        y = 0.6 * wedges[i].r * np.sin(np.radians(angle))+0.15  
        plt.text(x, y, label, ha='center', va='center', fontsize=14, color="white", weight="bold")

    
    plt.title("성별 유동인구 (천 명)", fontsize=16)
    gender_graph_path = save_with_unique_name(data_folder, "gender_values_pie_chart_with_labels")
    plt.savefig(gender_graph_path)
    plt.close()
    graph_paths.append(gender_graph_path)

    #시간대별 유동인구 그래프
    data['시간_숫자'] = pd.to_datetime(data['시간'], format='%H:%M').dt.hour

    plt.figure(figsize=(10, 6))
    morning_values = data[data['시간_숫자'] < 12].groupby('시간_숫자')[age_columns].sum().sum(axis=1) / 1000  # 천 명 단위
    afternoon_values = data[data['시간_숫자'] >= 12].groupby('시간_숫자')[age_columns].sum().sum(axis=1) / 1000  # 천 명 단위

    plt.plot(morning_values.index, morning_values.values, marker='o', label="오전 (0~11시)", color="skyblue")
    plt.plot(afternoon_values.index, afternoon_values.values, marker='o', label="오후 (12~23시)", color="orange")

    
    plt.title("시간대별 유동인구 (천 명)")
    plt.ylabel("유동인구 (천 명)")
    plt.xlabel("시간")
    plt.xticks(range(24))  
    plt.grid(axis="y", linestyle="--", alpha=0.7)
    plt.legend()

    
    time_graph_path = save_with_unique_name(data_folder, "time_values_morning_afternoon_lines")
    plt.savefig(time_graph_path)
    plt.close()
    graph_paths.append(time_graph_path)

    return graph_paths

#GPT-4o 보고서 작성 파트
def gpt_response(persona, user_input, graph_paths, start_date, end_date):
    processed_data = process_data(data, start_date, end_date)
    date = start_date + "~" + end_date
    today_date = datetime.now().strftime("%Y-%m-%d")

    #graph경로 불러오기
    graph_map = {
        "요일별 유동인구 분석": next((path for path in graph_paths if "weekday_values" in path), None),
        "연령대별 유동인구 분석": next((path for path in graph_paths if "age_group_values" in path), None),
        "성별 유동인구 분석": next((path for path in graph_paths if "gender_values" in path), None),
        "시간대별 유동인구 분석": next((path for path in graph_paths if "time_values" in path), None),
    }

    chat_prompt = [
        {
            "role": "system",
            "content": f"""
            
            ## 역할

            너는 데이터 분석 전문가이며, 마케팅 서비스 전문가입니다. {persona}에게 요일별, 연령별, 성별, 시간대별 유동인구 수에 따른 데이터를 기반으로 상권분석 보고서를 작성할거야. 
            형식은 '보고서 형식'입니다.

            ## 보고서 형식

            1. 서론: 
                목적: "" 
                분석 기간: 분석기간은 {date}로 설정되었습니다.
                작성일: {today_date}
                분석 방법: ""
            2. 요일별 유동인구 분석: 
                주요 발견: [요일별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                그래프: ![Graph]({graph_map['요일별 유동인구 분석']})
                추천 전략: ""
            3. 연령대별 유동인구 분석:
                주요 발견: [연령대별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                그래프: ![Graph]({graph_map['연령대별 유동인구 분석']})
                추천 전략: ""
            4. 성별 유동인구 분석:
                주요 발견: [성별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                그래프: ![Graph]({graph_map['성별 유동인구 분석']})
                추천 전략: ""
            5. 시간대별 유동인구 분석: 
                주요 발견: [시간대별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                그래프: ![Graph]({graph_map['시간대별 유동인구 분석']})
                추천 전략: ""
            6. 종합 결론: ""

            --- 

            ## 데이터 분석
            - 요일별 유동인구 합계: {processed_data['weekday_means']}
            - 연령별 유동인구 합계: {processed_data['age_means']}
            - 성별 유동인구 합계: 남성: {sum(processed_data['male_values'].values())}, 여성: {sum(processed_data['female_values'].values())}
            - 시간대별 유동인구 합계: {processed_data['time_means']}

            --- 

            ## 지침
            1. **보고서 형식**에 맞게 작성해주세요.
            2. 보고서에 **제목**은 추천전략,페르소나를 기반으로 설정해주세요. 
            3. 각 항목에 대해 데이터에 기반하여 **주요 발견**을 자동으로 도출하세요.
            4. **추천 전략**은 항목별 주요 발견을 참고하여 작성해주세요. 
            5. 보고서 형식에 2~5번 항목을 참고하여 6번의 결론을 작성해주세요.
            
            """
        },
        {
            "role": "user",
            "content": user_input
        }
    ]

    completion = client.chat.completions.create(
        model=deployment,
        messages=chat_prompt,
        max_tokens=1600,
        temperature=0.7,
        top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None,
        stream=False
    )
    
    if completion.choices:
        content = completion.choices[0].message.content
    else:
        content = "No content available"

    result = content
    return result


start_date = "2024-01-01"
end_date = "2024-01-07"
response = gpt_response(
    "돼지고기집", #페르소나나
    "", #빈칸일 때 무한루프 돌아감. text를 채워야함 
    graph_paths=create_visualizations(data, start_date=start_date, end_date=end_date), #그래프 경로 
    start_date=start_date, 
    end_date=end_date
)
print(response)