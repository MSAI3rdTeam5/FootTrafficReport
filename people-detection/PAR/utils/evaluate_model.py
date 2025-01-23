'''
Script to evaluate model performance
Usage:
python evaluate_model.py --csv_path <file.csv> --json_path <file.json> --model_name <model_name>
Input:
--csv_path -> csv file path with the infered results
--json_path -> json file path with the ground truth labels from cloud annotations.
Output:
The script generates 6 files:
1. ground_truth_general.csv -> Table with cleaned ground truth results for male and female.
2. inference_general.csv ->  Table with cleaned inferenced results for male and female.
3. general_comparison.csv -> Table with inferenced, ground truth and comparison results for male and female.
4. female_comparison.csv -> Table with inferenced, ground truth and comparison results only for female. 
5. male_comparison.csv -> Table with inferenced, ground truth and comparison results only for male.
6. model_name_report.txt -> Report with multiple results:
                            Global:
                            Results based on individual images.
                            Grouped by Person_Id No Weighted:
                            Results based on Person_Id
                            Grouped by Person_Id Weighted:
                            Results based on Person_Id weighted according to occurrence
'''

import pandas as pd
import os
import json
import logging
import argparse

# Level of warnings
logging.basicConfig(format='[%(levelname)s]: %(message)s', level=logging.NOTSET) 

#Parser
parser = argparse.ArgumentParser(description='Results Visualization framework')
parser.add_argument('--csv_path', type=str, required=True, help='path to csv infered results')
parser.add_argument('--json_path', type=str, required=True, help='path to json ground truth')
parser.add_argument('--model_name', type=str, required=True, help='Model name, there will be created a folder with the model name to store all metrics results')

def main():
    global args
    args = parser.parse_args() 
    csv_path = args.csv_path
    json_path = args.json_path
    model_name = args.model_name

    make_metrics(csv_path, json_path, model_name)
def make_metrics(csv_path, json_path, model_name):
    ##Load a dataframe from csv_path
    ##Read specific columns from csv file
    col_list = ["class_name", "confidence", "image_cropped_obj_path_saved", "video_path"]
    df_inference = pd.read_csv("metadata.csv", usecols=col_list)
    ##Clean Data, create dataframes: general, males,females.
    df_inference_clean = df_inference.dropna(subset=['class_name']).reset_index(drop=True)
    df_inference_clean['class_name'] = df_inference_clean['class_name'].apply(lambda x: 1 if x.replace(" ", "")=='male' else 0) ##Encode class_name: 1-male 0-female
    df_inference_clean = df_inference_clean.rename({'image_cropped_obj_path_saved': 'image_name', 'video_path': 'person_id'}, axis=1)  # new method
    df_inference_clean['image_name'] = df_inference_clean['image_name'].apply(lambda x: os.path.split(x)[1])
    df_inference_clean['image_name'] = df_inference_clean['image_name'].apply(lambda x: x.split(sep = '+')[1])
    df_inference_general = df_inference_clean.copy(deep=True)
    df_inference_female = ((df_inference_clean[df_inference_clean['class_name'] == 0]).reset_index(drop=True)).copy(deep=True)
    df_inference_male = ((df_inference_clean[df_inference_clean['class_name'] == 1]).reset_index(drop=True)).copy(deep=True)
    
    ##Load a dataframe from json_path
    
    df_ground_truth = pd.DataFrame(columns = ['image_name', 'ground_truth_class_name'])
    json_path = 'annotations.json'
    #cod = int(0)
    with open(json_path) as json_file:
            data = json.load(json_file)
            for key,value in data['annotations'].items():
                name = os.path.split(key)[1]
                name = name.split(sep = '+')[1]
                line = {'image_name': name, 'ground_truth_class_name': value[0]['label']}
                df_ground_truth = df_ground_truth.append(line, ignore_index=True)

    df_ground_truth_clean = df_ground_truth
    df_ground_truth_clean['ground_truth_class_name'] = df_ground_truth['ground_truth_class_name'].apply(lambda x: 1 if x.replace(" ", "")=='male' else 0)

    #df_ground_truth_clean['image_name'] = df_inference_clean['image_name'].apply(lambda x: os.path.split(x)[1] )
    df_ground_truth_general = (df_ground_truth_clean.copy(deep=True))
    #df_ground_truth_female = ((df_ground_truth_clean[df_ground_truth_clean['ground_truth_class_name'] == 0]).reset_index(drop=True)).copy(deep=True)
    #df_ground_truth_male = ((df_ground_truth_clean[df_ground_truth_clean['ground_truth_class_name'] == 1]).reset_index(drop=True)).copy(deep=True)

    ##Create main results csv
    inference_general_name = model_name + '_inference_general.csv'
    df_inference_general.to_csv(inference_general_name,index=False)
    ground_truth_general_name = model_name + '_ground_truth_general.csv'
    df_ground_truth_general.to_csv(ground_truth_general_name, index=False)

    ##Make an inner join with infered and ground truth tables. For general, female, male.
    df_general_comparison = (pd.merge(df_inference_general, df_ground_truth_general,how='inner', on='image_name')).reset_index(drop=True)
    df_female_comparison = (pd.merge(df_inference_female, df_ground_truth_general,how='inner', on='image_name')).reset_index(drop=True)
    df_male_comparison = (pd.merge(df_inference_male, df_ground_truth_general,how='inner', on='image_name')).reset_index(drop=True)
    #adding a new column to stores a correct inference truth value. For general, female, male.
    df_general_comparison['correct_inference'] = (df_general_comparison['class_name'] == df_general_comparison['ground_truth_class_name'])
    df_female_comparison['correct_inference'] = (df_female_comparison['class_name'] == df_female_comparison['ground_truth_class_name'])
    df_male_comparison['correct_inference'] = (df_male_comparison['class_name'] == df_male_comparison['ground_truth_class_name'])
    general_comparison_name = model_name + '_general_comparison.csv'
    female_comparison_name = model_name + '_female_comparison.csv'
    male_comparison_name = model_name + '_male_comparison.csv'
    #Write comparison dataframes to csv files. For general, female, male
    df_general_comparison.to_csv(general_comparison_name,index=False)
    df_female_comparison.to_csv(female_comparison_name,index=False)
    df_male_comparison.to_csv(male_comparison_name,index=False)
    reportname = model_name + '_report.txt'
    file2 = open(reportname,'w+')
    report = []
    report.append('                              Model Report                            \n')
    report.append('______________________________________________________________________\n')
    report.append('                                 Global                               \n')
    report.append('______________________________________________________________________\n')
    global_crops_amount = (df_general_comparison.count()).image_name# Numero global de crops
    female_crops_amount = (df_female_comparison.count()).image_name# Numero  de female crops
    male_crops_amount = (df_male_comparison.count()).image_name# Numero de male crops
    report_row = 'Total number of images: ' + str(global_crops_amount) + '\n' + 'Number of female images: ' + str(female_crops_amount) + '\n' 'Number of male images: ' + str(male_crops_amount) + '\n'
    report.append(report_row)

    global_crops_true = (df_general_comparison[df_general_comparison['correct_inference']==True].count()).image_name# global correct inferences
    global_crops_false = (df_general_comparison[df_general_comparison['correct_inference']==False].count()).image_name# global incorrect inferences

    female_crops_true = (df_female_comparison[df_female_comparison['correct_inference']==True].count()).image_name# female correct inferences
    female_crops_false = (df_female_comparison[df_female_comparison['correct_inference']==False].count()).image_name# female incorrect inferences

    male_crops_true = (df_male_comparison[df_male_comparison['correct_inference']==True].count()).image_name# male correct inferences
    male_crops_false = (df_male_comparison[df_male_comparison['correct_inference']==False].count()).image_name# male incorrect inferences

    report_row = '\nNumber of correct inferences: ' + str(global_crops_true) + '\n'+ 'Number of incorrect inferences: ' + str(global_crops_false) +'\n' + 'Accuracy: ' + str(global_crops_true/(global_crops_true+global_crops_false)) + '\n'
    report.append(report_row)
    report_row = '\nFemale: '
    report.append(report_row)
    report_row = '\nNumber of correct inferences on female: ' + str(female_crops_true) + '\n'+ 'Number of incorrect inferences on female: ' + str(female_crops_false) +'\n' + 'Accuracy on female: ' + str(female_crops_true/(female_crops_true+female_crops_false)) + '\n'
    report.append(report_row)

    report_row = '\nMale: '
    report.append(report_row)
    report_row = '\nNumber of correct inferences on male: ' + str(male_crops_true) + '\n'+ 'Number of incorrect inferences on male: ' + str(male_crops_false) +'\n' + 'Accuracy on male: ' + str(male_crops_true/(male_crops_true+male_crops_false)) + '\n' 
    report.append(report_row)

    #NOT WEIGHTED
    report.append('______________________________________________________________________\n')
    report.append('                 Grouped by Id Person: Not Weighted                   \n')
    report.append('______________________________________________________________________\n')
    #Generate General metrics on person_id. 
    df_general_comparison_grouped_by_person_id = df_general_comparison.groupby('person_id')['correct_inference'].value_counts(normalize=False, dropna=False).to_frame('counts')
    #Get sum of true values for id person
    df_f_general_comparison_grouped_by_person_id_reset_id = df_general_comparison_grouped_by_person_id.reset_index()
    true_sum = df_f_general_comparison_grouped_by_person_id_reset_id[df_f_general_comparison_grouped_by_person_id_reset_id['correct_inference'] == True]
    general_true_sum = (true_sum.count()).correct_inference
    false_sum = df_f_general_comparison_grouped_by_person_id_reset_id[df_f_general_comparison_grouped_by_person_id_reset_id['correct_inference'] == False]
    general_false_sum = (false_sum.count()).correct_inference
    #report_row = 'Total number of person_id: ' + str((df_f_general_comparison_grouped_by_person_id_reset_id.count()).person_id) + '\n' + 'Number of female person_id: ' + str((df_f_female_comparison_grouped_by_person_id_reset_id.count()).person_id) + '\n' 'Number of male person_id: ' + str((df_f_male_comparison_grouped_by_person_id_reset_id.count()).person_id) + '\n'
    #report.append(report_row)

    report_row = '\nUnweighted global number of correct inferences: ' + str(general_true_sum) + '\nUnweighted global number of incorrect inferences: ' + str(general_false_sum) + '\nUnweighted global accuracy: ' + str(general_true_sum/(general_true_sum+general_false_sum)) + '\n'
    report.append(report_row)
    #Generate Female metrics on person_id. 
    df_female_comparison_grouped_by_person_id = df_female_comparison.groupby('person_id')['correct_inference'].value_counts(normalize=False, dropna=False).to_frame('counts')
    #Get sum of true values for id person
    df_f_female_comparison_grouped_by_person_id_reset_id = df_female_comparison_grouped_by_person_id.reset_index()
    true_sum = df_f_female_comparison_grouped_by_person_id_reset_id[df_f_female_comparison_grouped_by_person_id_reset_id['correct_inference'] == True]
    female_true_sum = (true_sum.count()).correct_inference
    false_sum = df_f_female_comparison_grouped_by_person_id_reset_id[df_f_female_comparison_grouped_by_person_id_reset_id['correct_inference'] == False]
    female_false_sum = (false_sum.count()).correct_inference

    report_row = '\nUnweighted female number of correct inferences: ' + str(female_true_sum) + '\nUnweighted female number of incorrect inferences: ' +  str(female_false_sum) + '\nUnweighted female accuracy: ' + str(female_true_sum/(female_true_sum+female_false_sum)) + '\n'
    report.append(report_row)
    #Generate Male metrics on person_id.
    df_male_comparison_grouped_by_person_id = df_male_comparison.groupby('person_id')['correct_inference'].value_counts(normalize=False, dropna=False).to_frame('counts')
    #Get sum of true values for id person
    df_f_male_comparison_grouped_by_person_id_reset_id = df_male_comparison_grouped_by_person_id.reset_index()
    true_sum = df_f_male_comparison_grouped_by_person_id_reset_id[df_f_male_comparison_grouped_by_person_id_reset_id['correct_inference'] == True]
    male_true_sum = (true_sum.count()).correct_inference
    false_sum = df_f_male_comparison_grouped_by_person_id_reset_id[df_f_male_comparison_grouped_by_person_id_reset_id['correct_inference'] == False]
    male_false_sum = (false_sum.count()).correct_inference

    report_row = '\nUnweighted male number of correct inferences: ' + str(male_true_sum) + '\nUnweighted male number of incorrect inferences: ' +  str(male_false_sum) + '\nUnweighted male accuracy: ' + str(male_true_sum/(male_true_sum+male_false_sum)) + '\n'
    report.append(report_row)
    #WEIGHTED
    report.append('______________________________________________________________________\n')
    report.append('                 Grouped by Id Person: Weighted                       \n')
    report.append('______________________________________________________________________\n')
    #Generate General metrics on person_id. 
    df_general_comparison_grouped_by_person_id_weighted = (df_general_comparison_grouped_by_person_id.counts/len(df_general_comparison)).to_frame()
    #Get sum of true values for id person
    df_f_general_comparison_grouped_by_person_id_reset_id_weighted = df_general_comparison_grouped_by_person_id_weighted.reset_index()
    true_sum = df_f_general_comparison_grouped_by_person_id_reset_id_weighted[df_f_general_comparison_grouped_by_person_id_reset_id_weighted['correct_inference'] == True]
    general_true_sum_weighted = (true_sum.sum()).counts
    false_sum = df_f_general_comparison_grouped_by_person_id_reset_id_weighted[df_f_general_comparison_grouped_by_person_id_reset_id_weighted['correct_inference'] == False]
    general_false_sum_weighted = (false_sum.sum()).counts
    report_row = '\nWeighted global number of correct inferences: ' + str(general_true_sum_weighted) + '\nWeighted global number of incorrect inferences: ' + str(general_false_sum_weighted) + '\nWeighted global accuracy: ' + str(general_true_sum_weighted/(general_true_sum_weighted+general_false_sum_weighted)) + '\n'
    report.append(report_row)
    #Generate General metrics on person_id. 
    df_female_comparison_grouped_by_person_id_weighted = (df_female_comparison_grouped_by_person_id.counts/len(df_female_comparison)).to_frame()
    #Get sum of true values for id person
    df_f_female_comparison_grouped_by_person_id_reset_id_weighted = df_female_comparison_grouped_by_person_id_weighted.reset_index()
    true_sum = df_f_female_comparison_grouped_by_person_id_reset_id_weighted[df_f_female_comparison_grouped_by_person_id_reset_id_weighted['correct_inference'] == True]
    female_true_sum_weighted = (true_sum.sum()).counts
    false_sum = df_f_female_comparison_grouped_by_person_id_reset_id_weighted[df_f_female_comparison_grouped_by_person_id_reset_id_weighted['correct_inference'] == False]
    female_false_sum_weighted = (false_sum.sum()).counts
    report_row = '\nWeighted female number of correct inferences: ' + str(female_true_sum_weighted) + '\nWeighted female number of incorrect inferences: ' + str(female_false_sum_weighted) + '\nWeighted female accuracy: ' + str(female_true_sum_weighted/(female_true_sum_weighted+female_false_sum_weighted))+'\n'
    report.append(report_row)
    #Generate General metrics on person_id. 
    df_male_comparison_grouped_by_person_id_weighted = (df_male_comparison_grouped_by_person_id.counts/len(df_male_comparison)).to_frame()
    #Get sum of true values for id person
    df_f_male_comparison_grouped_by_person_id_reset_id_weighted = df_male_comparison_grouped_by_person_id_weighted.reset_index()
    true_sum = df_f_male_comparison_grouped_by_person_id_reset_id_weighted[df_f_male_comparison_grouped_by_person_id_reset_id_weighted['correct_inference'] == True]
    male_true_sum_weighted = (true_sum.sum()).counts
    false_sum = df_f_male_comparison_grouped_by_person_id_reset_id_weighted[df_f_male_comparison_grouped_by_person_id_reset_id_weighted['correct_inference'] == False]
    male_false_sum_weighted = (false_sum.sum()).counts
    report_row = '\nWeighted male number of correct inferences: ' + str(male_true_sum_weighted) + '\nWeighted male number of incorrect inferences: ' + str(male_false_sum_weighted) +  '\nWeighted male accuracy: ' + str(male_true_sum_weighted/(male_true_sum_weighted+male_false_sum_weighted)) + '\n'
    report.append(report_row)

    for line in report:
        file2.write(line)
    file2.close()

if __name__ == '__main__':
    main()