import matplotlib.pyplot as plt
import argparse
import logging
from PIL import Image 
import pandas as pd
import os
import csv
from math import ceil
from attributes import attributes_list 

parser = argparse.ArgumentParser(description='Results Visualization framework')
parser.add_argument('--input_csv', type=str, required=True, help='path to csv inference results')
parser.add_argument('--num_images', default=-1,type=int, required=False, help='Number of images to display. Default -1: <all images>')


# Level of warnings
logging.basicConfig(format='[%(levelname)s]: %(message)s', level=logging.INFO) 

def main():

    global args, best_accu
    args = parser.parse_args()
    ROOT_PATH = '/home/ubuntu/gender_repos/iccv19_attribute/'
    print('=' * 100)
    print('Arguments = ')
    for arg in vars(args):
        print('\t' + arg + ':', getattr(args, arg))
    print('=' * 100)

    #Call function
    df_results = args.input_csv
    num_images = args.num_images
    create_results_visualization(ROOT_PATH, df_results,num_images)



def create_results_visualization(ROOT_PATH,results_path,num_results):
    '''
    input: 
    inferences_file.csv -> csv file containing inference results in format: name,at1,..,atn
    num_results -> number of images to display

    output: 
    results.png -> png image with <num_results> images and their inferences
    '''

    DATA_DIR = os.environ.get('LOCAL_DATA_DIR')
    
    #DATA_DOWNLOAD_DIR = os.environ.get('DATA_DOWNLOAD_DIR')
    csv_path = results_path
    results = []
     
    
    with open(csv_path) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        headings = next(csv_reader)
        for row in csv_reader:
            results_per_img = []
            
            for _ in (atr+1 for atr in range(len(headings)-1)):
                results_per_img.append(row[_])
            results.append((row[0], results_per_img))
        
        logging.info('Grid frame: {}'.format((results))) 

    w,h = 200,200
    fig = plt.figure(figsize=(30,30))
    columns = 4
    rows = 4
    for i in range(1, columns*rows):
        ax = fig.add_subplot(rows, columns,i)
        img = Image.open(os.path.join(ROOT_PATH,results[i][0]))
        img = img.resize((w,h), Image.ANTIALIAS)
        plt.imshow(img)
        name = str(i) + results[i][0]
        plt.savefig('.png')
        ax.set_title(results[i][1], fontsize=40)

        
if __name__ == '__main__':
    main()