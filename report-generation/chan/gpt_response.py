from visualization import create_visualizations
from data_processing import process_data
from datetime import datetime
from dotenv import load_dotenv
import os
from openai import AzureOpenAI
import pandas as pd

load_dotenv()

# 환경 변수 읽기
endpoint = os.getenv("ENDPOINT_URL")
deployment = os.getenv("DEPLOYMENT_NAME")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY")   

# Initialize Azure OpenAI Service client with key-based authentication    
client = AzureOpenAI(  
    azure_endpoint=endpoint,  
    api_key=subscription_key,  
    api_version="2024-05-01-preview",
)


def gpt_response(persona, user_input, data, start_date, end_date):
    graph_paths = create_visualizations(data, start_date=start_date, end_date=end_date)
    processed_data = process_data(data, start_date, end_date)
    date = start_date + "~" + end_date
    today_date = datetime.now().strftime("%Y-%m-%d")

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
            4. **추천 전략**은 항목별 주요 발견을 참고하여 작성해주세요. 이 때 **추천 전략**은 마크다운언어로 리스트 형식이 아닌 상태로 나오게 해주세요. 
            ex) 추천 전략:
                1.
                2. 
            5. 보고서 형식에 2~5번 항목을 요약하여 6번의 **종합 결론**을 작성해주세요.
            
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

