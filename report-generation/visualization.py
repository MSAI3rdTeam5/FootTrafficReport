import os
import time
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# 전달 받은 데이터를 시각화 하는 과정

# 원하는 기간의 데이터를 위해 데이터 기간 정리
def filter_data_by_date(data, start_date, end_date):
    data['date'] = pd.to_datetime(data['date'])
    return data[(data['date'] >= start_date) & (data['date'] <= end_date)]

# 각 image에 번호를 안붙히면 한번 만든 이미지로 계속 가기때문에 생성때마다 이미지에 고유 번호 붙이기
def save_with_unique_name(folder, base_name, ext=".png"):
    if not os.path.exists(folder):
        os.makedirs(folder)
    timestamp = int(time.time())
    return os.path.join(folder, f"{base_name}_{timestamp}{ext}")

# 그래프 font 설정
def set_korean_font():
    plt.rcParams["font.family"] = "Malgun Gothic"
    plt.rcParams["axes.unicode_minus"] = False

# 데이터 시각화 과정
def create_visualizations(data, start_date=None, end_date=None):
    
    def set_korean_font():
        plt.rcParams["font.family"] = "Malgun Gothic"
        plt.rcParams["axes.unicode_minus"] = False

    set_korean_font()
    
    graph_paths = []
    data_folder = "./FootTrafficReport/report-generation/data_graph" #현재 로컬에선 data_graph경로로 설정해 활용중이지만 추후 경로수정 필요

    if start_date and end_date:
        data = filter_data_by_date(data, start_date, end_date)
    else:
        print('입력오류')
        
    age_columns = ["male_adult", "female_adult", "male_old", "female_old", "male_young", "female_young"]
    
    # 요일별 유동인구
    weekday_order = ["월", "화", "수", "목", "금", "토", "일"]
    data['day_of_week'] = pd.Categorical(data['day_of_week'], categories=weekday_order, ordered=True)
    plt.figure(figsize=(8, 5))
    weekday_values = data.groupby("day_of_week")[age_columns].sum() / 1000  
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
    plt.figure(figsize=(8, 5))
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
    male_columns = [col for col in data.columns if col.startswith("male")]
    female_columns = [col for col in data.columns if col.startswith("female")]

    male_values = data[male_columns].sum().sum() / 1000  
    female_values = data[female_columns].sum().sum() / 1000  
    gender_values = [male_values, female_values]
    labels = ["남성", "여성"]
    colors = ["skyblue", "pink"]

    plt.figure(figsize=(6, 6))
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
    data['시간_숫자'] = pd.to_datetime(data['time'], format='%H:%M').dt.hour

    plt.figure(figsize=(8, 5))
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

    # 각 그래프를 이미지로 저장하고 그래프 경로를 return으로 전달    
    time_graph_path = save_with_unique_name(data_folder, "time_values_morning_afternoon_lines")
    plt.savefig(time_graph_path)
    plt.close()
    graph_paths.append(time_graph_path)

    return graph_paths