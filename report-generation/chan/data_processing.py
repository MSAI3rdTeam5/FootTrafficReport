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
