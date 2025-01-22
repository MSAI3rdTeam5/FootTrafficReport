
import os  
from openai import AzureOpenAI
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import openai  # LLM 사용 시 필요  

endpoint = os.getenv("ENDPOINT_URL", "ENDPOINT_URL")  
deployment = os.getenv("DEPLOYMENT_NAME", "gpt-4o")  
subscription_key = os.getenv("AZURE_OPENAI_API_KEY", "AZURE_OPENAI_API_KEY")  

# Initialize Azure OpenAI Service client with key-based authentication    
client = AzureOpenAI(  
    azure_endpoint=endpoint,  
    api_key=subscription_key,  
    api_version="2024-05-01-preview",
)

import pandas as pd

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
def set_korean_font():
    plt.rcParams["font.family"] = "Malgun Gothic"
    plt.rcParams["axes.unicode_minus"] = False

set_korean_font()


data_file = "weekend_weighted.csv" 
data = pd.read_csv(data_file)

def filter_data_by_date(data, start_date, end_date):
    data['날짜'] = pd.to_datetime(data['날짜'])
    
 
    filtered_data = data[(data['날짜'] >= start_date) & (data['날짜'] <= end_date)]
    
    return filtered_data
def create_visualizations(data, start_date=None, end_date=None):
    graph_paths = []

    if start_date and end_date:
        data = filter_data_by_date(data, start_date, end_date)

    # 연령별 유동인구 
    plt.figure(figsize=(10, 6))
    age_columns = ["남자 청년", "여자 청년", "남자 중장년", "여자 중장년", "남자 청소년 이하", "여자 청소년 이하"]
    age_values = data[age_columns].sum()  
    age_values.plot(kind="bar", color=["skyblue", "pink", "blue", "lightcoral", "green", "lightgreen"])
    plt.title("연령별 유동인구 (합계)")
    plt.ylabel("유동인구")
    plt.xticks(rotation=45)
    plt.tight_layout()
    age_graph_path = "age_group_values.png"
    plt.savefig(age_graph_path)
    plt.close()
    graph_paths.append(age_graph_path)

    # 요일별 유동인구 
    weekday_order = ["월", "화", "수", "목", "금", "토", "일"]
    data['요일'] = pd.Categorical(data['요일'], categories=weekday_order, ordered=True)
    
    plt.figure(figsize=(10, 6))
    weekday_values = data.groupby("요일")[age_columns].sum()  
    weekday_values_total = weekday_values.sum(axis=1)  
    weekday_values_total.plot(kind="bar", color="purple")  
    plt.title("요일별 유동인구 (합계)")
    plt.ylabel("유동인구")
    plt.xlabel("요일")
    plt.tight_layout()
    weekday_graph_path = "weekday_values.png"
    plt.savefig(weekday_graph_path)
    plt.close()
    graph_paths.append(weekday_graph_path)

    # 시간대별 유동인구
    plt.figure(figsize=(10, 6))
    time_values = data.groupby("시간")[age_columns].sum()  
    time_values_total = time_values.sum(axis=1) 
    time_values_total.plot(kind="line", marker="o", color="orange")  
    plt.title("시간대별 유동인구 (합계)")
    plt.ylabel("유동인구")
    plt.xlabel("시간")
    plt.tight_layout()
    time_graph_path = "time_values.png"
    plt.savefig(time_graph_path)
    plt.close()
    graph_paths.append(time_graph_path)

    # 성별 유동인구 그래프
    male_columns = [col for col in data.columns if col.startswith("남")]
    female_columns = [col for col in data.columns if col.startswith("여")]
    
   
    male_values = data[male_columns].sum()
    female_values = data[female_columns].sum()

    plt.figure(figsize=(10, 6))
    gender_values = pd.Series([male_values.sum(), female_values.sum()], index=["남성", "여성"])
    gender_values.plot(kind="bar", color=["blue", "pink"])
    plt.title("성별 유동인구 (합계)")
    plt.ylabel("유동인구")
    plt.xticks(rotation=0)
    plt.tight_layout()
    gender_graph_path = "gender_values.png"
    plt.savefig(gender_graph_path)
    plt.close()
    graph_paths.append(gender_graph_path)

    return graph_paths
def gpt_response(persona, user_input, graph_paths,start_date,end_date):
    processed_data = process_data(data, start_date, end_date)
    date = start_date + "~" + end_date
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
            2. 분석개요: 
                분석 기간: 분석기간은 {date}로 설정되었습니다.
                분석 방법: ""
            3. 요일별 유동인구 분석: 
                주요 발견: [요일별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                추천 전략: ""
            4. 연령대별 유동인구 분석:
                주요 발견: [연령대별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                추천 전략: ""
            5. 성별 유동인구 분석:
                주요 발견: [성별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                추천 전략: ""
            6. 시간대별 유동인구 분석: 
                주요 발견: [시간대별 유동인구에 대한 분석 결과를 자동으로 도출하여 작성]
                추천 전략: ""
            7. 종합 결론: ""

            --- 

            ## 데이터 분석
            - 요일별 유동인구 합계: {processed_data['weekday_means']}
            - 연령별 유동인구 합계: {processed_data['age_means']}
            - 성별 유동인구 합계: 남성: {sum(processed_data['male_values'].values())}, 여성: {sum(processed_data['female_values'].values())}
            - 시간대별 유동인구 합계: {processed_data['time_means']}

            --- 

            ## 지침
            1. **보고서 형식**에 맞게 작성해주세요.
            2. 각 항목에 대해 데이터에 기반하여 **주요 발견**을 자동으로 도출하세요.
            3. **추천 전략**은 항목별 주요 발견을 참고하여 작성해주세요. 
            4. 보고서 형식에 1~6번 항목을 참고하여 7번의 결론을 작성해주세요.
            
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
    if graph_paths:
        result += "\n\n그래프 파일들:\n\n" + "\n".join([f"![Graph]({path})" for path in graph_paths])  # 이미지 파일을 Markdown 형식으로 변환
    return result



start_date = "2024-01-01"
end_date = "2024-01-07"
graph_paths = create_visualizations(data, start_date=start_date, end_date=end_date)

response = gpt_response("돼지고기집", "일주일간의 데이터를 기반으로 보고서 작성해주세요", graph_paths=graph_paths,start_date=start_date,end_date=end_date)
print(response)