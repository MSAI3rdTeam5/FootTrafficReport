import requests

def Azure():
    # 1. URL 설정
    url = "Published Prediction URL"

    # 2&3. Headers 설정
    headers = {
        "Prediction-Key": "Published Prediction Key",
        "Content-Type": "application/octet-stream"
    }

    # 4. 이미지 파일 읽기
    image_path = "dataset/Test.png"
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()

    # 5. POST 요청 보내기
    response = requests.post(url, 
                            headers=headers, 
                            data=image_data)

    # 결과 확인
    result = response.json()

    # predictions 딕셔너리 생성
    predictions = {}
    for prediction in result['predictions']:
        predictions[prediction['tagName']] = prediction['probability'] * 100
        
    return predictions

def normalize_predictions(predictions):
    # gender와 age_class 그룹으로 분리
    gender_preds = {k:v for k,v in predictions.items() if k in ['male', 'female']}
    age_preds = {k:v for k,v in predictions.items() if k in ['adult', 'old', 'young']}
    
    # 각 그룹별 정규화
    def normalize_group(group_preds):
        total = sum(group_preds.values())
        if total == 0:
            return group_preds
        return {k: (v/total)*100 for k,v in group_preds.items()}
    
    # 정규화된 결과 합치기
    normalized_gender = normalize_group(gender_preds)
    normalized_age = normalize_group(age_preds)
    
    # 결과 출력
    print("Gender predictions (normalized):")
    for k,v in normalized_gender.items():
        if k in ['male', 'female']:
            print(f"{k}: {v:.2f}%")

    print("\nAge predictions (normalized):")
    for k,v in normalized_age.items():
        if k in ['adult', 'old', 'young']:
            print(f"{k}: {v:.2f}%")
    #return {**normalized_gender, **normalized_age}


def main():
    predictions = Azure()
    normalize_predictions(predictions)
    

if __name__ == "__main__":
    main()