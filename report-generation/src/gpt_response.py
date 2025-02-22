from .visualization import create_visualizations
from .data_processing import process_data
from datetime import datetime
from dotenv import load_dotenv
import os
from openai import AzureOpenAI
import pandas as pd

load_dotenv()

# env파일 불러오기. GPT-4o or o1 사용가능
ENDPOINT_URL = os.getenv("ENDPOINT_URL")
DEPLOYMENT_NAME = os.getenv("DEPLOYMENT_NAME")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")   

client = AzureOpenAI(  
    azure_endpoint=ENDPOINT_URL,  
    api_key=AZURE_OPENAI_API_KEY,  
    api_version="2024-12-01-preview",
)

# Azure Open AI를 활용해 Chat-bot으로 보고서 생성 코드
def gpt_response(persona, user_input, data, start_date, end_date):
    
    #데이터 시각화 그래프 경로 불러오기
    graph_paths = create_visualizations(data, start_date=start_date, end_date=end_date)
    
    #가공된 데이터 불러오기
    processed_data = process_data(data, start_date, end_date)
    date = start_date + "~" + end_date
    today_date = datetime.now().strftime("%Y-%m-%d")

    #불러온 그래프 경로활용
    graph_map = {
        "요일별 유동인구 분석": next((path for path in graph_paths if "weekday_values" in path), None),
        "연령대별 유동인구 분석": next((path for path in graph_paths if "age_group_values" in path), None),
        "성별 유동인구 분석": next((path for path in graph_paths if "gender_values" in path), None),
        "시간대별 유동인구 분석": next((path for path in graph_paths if "time_values" in path), None),
    }

    # 프롬프팅 구현
    chat_prompt = [
        {
            "role": "system",
            "content": f"""
            
            ## 역할

            너는 데이터 분석과 창업 컨설팅 전문가야. 
            {persona}에게 {date} 기간 동안 수집된 유동인구 데이터를 분석하여 **창업 가능성이 높은 업종과 전략을 제시하는 보고서**를 작성할 거야. 
            분석된 데이터는 창업 입지 및 타겟 고객층을 고려한 전략 수립에 활용될 거야.

            ## 보고서 형식

            1. **서론:** 
                - 목적: 유동인구 데이터를 바탕으로 최적의 창업 아이템과 입지 전략을 제안합니다.
                - 분석 기간: {date}
                - 작성일: {today_date}
                - 분석 방법: 요일, 연령, 성별, 시간대별 유동인구 데이터를 기반으로 창업 가능성이 높은 업종과 최적의 입지를 분석합니다.

            2. **요일별 유동인구 분석**  
                - 주요 발견: [요일별 유동인구 패턴과 창업에 미치는 영향을 분석]  
                - 그래프: ![Graph]({graph_map['요일별 유동인구 분석']})  
                - 추천 전략: 창업자가 고려해야 할 **운영 시간** 및 **요일별 특화 전략**을 제안  

            3. **연령대별 유동인구 분석**  
                - 주요 발견: [연령대별 유동인구 패턴과 창업에 미치는 영향 분석]  
                - 그래프: ![Graph]({graph_map['연령대별 유동인구 분석']})  
                - 추천 전략: 주요 연령대 소비 성향을 고려한 **추천 업종** 및 **마케팅 전략** 제시  

            4. **성별 유동인구 분석**  
                - 주요 발견: [성별 유동인구 데이터 기반 분석]  
                - 그래프: ![Graph]({graph_map['성별 유동인구 분석']})  
                - 추천 전략: 업종별 성별 선호도를 고려한 **메뉴 구성, 프로모션 전략** 제안  

            5. **시간대별 유동인구 분석**  
                - 주요 발견: [시간대별 유동인구 데이터 기반 분석]  
                - 그래프: ![Graph]({graph_map['시간대별 유동인구 분석']})  
                - 추천 전략: **운영 시간 최적화** 및 **시간대별 마케팅 전략** 수립  

            6. **결론 및 창업 전략 제안**  
                - 종합적으로 분석된 유동인구 데이터를 바탕으로 창업 적합성이 높은 업종을 제안  
                - 특정한 위치나 상권에서 실행 가능한 **창업 모델 및 실행 계획** 제공  

            --- 

            ## 데이터 분석 개요
            - 요일별 유동인구 합계: {processed_data['weekday_means']}
            - 연령별 유동인구 합계: {processed_data['age_means']}
            - 성별 유동인구 합계: 남성: {sum(processed_data['male_values'].values())}, 여성: {sum(processed_data['female_values'].values())}
            - 시간대별 유동인구 합계: {processed_data['time_means']}

            --- 

            ## 지침
            1. **보고서 형식**에 맞게 작성해주세요.
            2. 보고서 **제목**은 예비창업가의 창업 분야를 반영하여 작성하세요. 
            3. **각 항목별 주요 발견을 데이터 기반으로 분석**하고, 창업 전략과 연관 지어 설명하세요.
            4. **추천 전략**은 창업 아이템과 연관된 전략(입지, 운영시간, 마케팅, 서비스 차별화 등)을 구체적으로 150자 이상 작성해주세요. 
            5. **결론에서는 창업자가 실행할 수 있는 구체적인 액션 플랜**을 제시하세요.
            6. 예비창업가의 창업 업종을 특정하여, 해당 업종에 맞는 맞춤형 컨설팅 보고서를 작성하세요.
            7. 보고서가 나올때 html언어로 나오게 해주세요. 보고서를 css로 디자인해주세요. 
            
            
            ---
            
            ### 제한사항
            1. <header>에 날짜는 포함하지 마세요. css에서 <header>의 background 색깔과 <h1>,<h2>의 색이 반드시 다르게 해주세요.
            2. 마지막 <footer>작성 시 ' @ 2025 IseeU. All rights reserved.'라는 글로 작성해주세요.
            3. 반드시 css로 디자인할 때 **배경**과 **글자색**이 안 겹치게 해주세요.
            
            """
        },
        {
            "role": "user",
            "content": user_input
        }
    ]

    completion = client.chat.completions.create(
        model=DEPLOYMENT_NAME,
        messages=chat_prompt,
        # max_tokens=3500,
        max_completion_tokens=100000,
        # temperature=0.7,
        # top_p=0.95,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None,
        stream=False
    )
    
    # HTML형식으로 Output값이 나오게 하며 그 값을 return함
    if completion.choices:
        content = completion.choices[0].message.content
    else:
        content = "No content available"

    result = content
    return result

