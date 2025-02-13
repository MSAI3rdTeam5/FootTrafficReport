import os
import requests
import csv
import xml.etree.ElementTree as ET
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

#--------------------------------------------Azure 결과 확인 부분-------------------------------------------------
def Azure(file_path):
    # 1. URL 설정
    url = "https://ai-services123.cognitiveservices.azure.com/customvision/v3.0/Prediction/e2185b3d-d764-4aeb-a672-5c2480425c05/classify/iterations/Iteration1/image"

    # 2&3. Headers 설정
    headers = {
        "Prediction-Key": "GEbnMihAUjSdLaPRMRkMyioJBnQLV45TnpV66sh1tD0BxUO9Nkl9JQQJ99BAACYeBjFXJ3w3AAAEACOG0gLQ",
        "Content-Type": "application/octet-stream"
    }

    # 4. 이미지 파일 읽기
    with open(file_path, "rb") as image_file:
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
        return {k: round((v/total)*100, 2) for k,v in group_preds.items()}
    
    # 정규화된 결과 합치기
    normalized_gender = normalize_group(gender_preds)
    normalized_age = normalize_group(age_preds)
    
    return {**normalized_gender, **normalized_age}
#-------------------------------------------------------------------------------------------------------------------------------

#----------------------------------------------XML 라벨 획득 부분-----------------------------------------------------------------
def classify_age(age):
    try:
        age = int(age)
        if age <= 19:
            return "young"
        elif 20 <= age <= 40:
            return "adult"
        else:
            return "old"

    except (ValueError, TypeError):
        return "Unknown"
    
def extract_from_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    gender = root.find('.//gender').text if root.find('.//gender') is not None else 'Unknown'
    age = root.find('.//age').text if root.find('.//age') is not None else 'Unknown'
    
    age_class = classify_age(age)

    return gender, age_class
#-------------------------------------------------------------------------------------------------------------------------------

#-----------------------------------------------CSV 파일 처리 부분-----------------------------------------------------------------
def get_highest_probability_label(predictions, category):
    category_preds = {k:v for k,v in predictions.items() if k in category}
    return max(category_preds, key=category_preds.get)

def process_folder(folder_path, csv_file_path):
    image_files = [f for f in os.listdir(folder_path) if f.endswith('.png')]
    results = []

    for image_file in image_files:
        base_name = os.path.splitext(image_file)[0]
        xml_file = base_name + '.xml'
        
        image_path = os.path.join(folder_path, image_file)
        xml_path = os.path.join(folder_path, xml_file)
        
        # 변경 없음: XML 파일이 없을 경우 스킵
        if not os.path.exists(xml_path):
            print(f"XML file not found for {image_file}. Skipping this image.")
            continue

        try:
            predictions = Azure(image_path)
            normalized_predictions = normalize_predictions(predictions)
            
            gender_label = get_highest_probability_label(normalized_predictions, ['male', 'female'])
            age_label = get_highest_probability_label(normalized_predictions, ['adult', 'old', 'young'])
            
            # XML 파일에서 실제 gender와 age 추출
            actual_gender, actual_age_class = extract_from_xml(xml_path)
            
            result_dict = {
                'Image': os.path.basename(image_path),
                **normalized_predictions,
                'Predicted Gender': gender_label,
                'Predicted Age': age_label,
                'Actual Gender': actual_gender,
                'Actual Age': actual_age_class
            }
            results.append(result_dict)
        except Exception as e:
            print(f"Error processing {image_file}: {str(e)}")
            continue

    if results:
        with open(csv_file_path, 'w', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)
        return True
    else:
        print("No results to save. All images were skipped or encountered errors.")
        return False

#---------------------------------------------------------------------------------------------------------------------------

#-------------------------------------------------평가 지표 부분-------------------------------------------------------------
def calculate_metrics(y_true, y_pred, category):
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='weighted')
    recall = recall_score(y_true, y_pred, average='weighted')
    conf_matrix = confusion_matrix(y_true, y_pred)
    
    print(f"\n{category} 분류 평가 지표:")
    print(f"정확도: {accuracy:.4f}")
    print(f"정밀도: {precision:.4f}")
    print(f"재현율: {recall:.4f}")
    print(f"\n{category} 혼동 행렬:")
    print(conf_matrix)
    
    return accuracy, precision, recall, conf_matrix

def evaluate_predictions(csv_file_path):
    df = pd.read_csv(csv_file_path)

    gender_metrics = calculate_metrics(df['Actual Gender'], df['Predicted Gender'], '성별')
    gender_conf_matrix = gender_metrics[3]
    disp_gender = ConfusionMatrixDisplay(confusion_matrix=gender_conf_matrix, display_labels=df['Actual Gender'].unique())
    disp_gender.plot(cmap='viridis')
    plt.show()

    age_metrics = calculate_metrics(df['Actual Age'], df['Predicted Age'], '나이')
    age_conf_matrix = age_metrics[3]  # 튜플에서 confusion matrix 추출
    disp_age = ConfusionMatrixDisplay(confusion_matrix=age_conf_matrix, display_labels=df['Actual Age'].unique())
    disp_age.plot(cmap='viridis')
    plt.show()
    
    return gender_metrics, age_metrics
#---------------------------------------------------------------------------------------------------------------------------

def main():
    folder_path = "Test"  # 처리할 폴더의 경로를 입력하세요
    csv_file_path = 'Result.csv'  # CSV 파일 경로 지정
    
    if process_folder(folder_path, csv_file_path):
        print(f"Results with predicted and actual labels saved to '{csv_file_path}'.")
    else:
        print("Failed to save results.")

    gender_metrics, age_metrics = evaluate_predictions(csv_file_path)

if __name__ == "__main__":
    main()