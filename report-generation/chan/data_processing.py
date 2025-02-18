import pandas as pd

def process_data(data, start_date, end_date):
    data["date"] = pd.to_datetime(data["date"])
    filtered_data = data[(data["date"] >= start_date) & (data["date"] <= end_date)]
    
    weekday_order = ["월", "화", "수", "목", "금", "토", "일"]
    age_columns = ["male_adult", "female_adult", "male_old", "female_old", "male_young", "female_young"]
    
    weekday_means = filtered_data.groupby("day_of_week")[age_columns].sum().sum(axis=1)
    weekday_means = weekday_means[weekday_order]
    
    age_means = filtered_data[age_columns].sum()
    
    male_columns = [col for col in filtered_data.columns if col.startswith("male")]
    female_columns = [col for col in filtered_data.columns if col.startswith("female")]
    male_values = filtered_data[male_columns].sum()
    female_values = filtered_data[female_columns].sum()
    
    time_means = filtered_data.groupby("time")[age_columns].sum().sum(axis=1)
    
    processed_data = {
        "weekday_means": weekday_means.to_dict(),
        "age_means": age_means.to_dict(),
        "male_values": male_values.to_dict(),
        "female_values": female_values.to_dict(),
        "time_means": time_means.to_dict()
    }
    
    return processed_data
