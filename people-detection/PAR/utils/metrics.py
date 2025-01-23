import argparse
import os
import shutil
import time
import sys
import numpy as np
import logging
import torch
import pandas as pd
import argparse



# Level of warnings
logging.basicConfig(format='[%(levelname)s]: %(message)s', level=logging.NOTSET) 

#Parser
parser = argparse.ArgumentParser(description='Results Visualization framework')
parser.add_argument('--input_path', type=str, required=True, help='path to csv annotations')



def main():
    global args
    args = parser.parse_args() 
    path = args.input_path
    annotations = make_metrics(path)

def make_metrics(path_annotations):
    """
    input: path_annotations -> Path of annotations file
    output: pytorch tensor of attribute occurrences
    """

    try:
        df_annotations = pd.read_csv(path_annotations,sep=" ", header = None)
    except:
        logging.critical('Cannot read the file: {}'.format(path_annotations)) 
        return 
    

    logging.info('Data Frame loaded: {}'.format(df_annotations)) 
    num_attributes = len(df_annotations.columns)
    resume = df_annotations.iloc[:,1:num_attributes].sum()
    index = df_annotations.index
    number_of_rows = len(index)
    list_weights = resume.tolist() 
    list_weights_normalized = [round(x / number_of_rows,4) for x in list_weights]
    logging.info('List of Weights: {}'.format(list_weights_normalized )) 
    tensor_weights = torch.Tensor(list_weights_normalized).cuda()

    return tensor_weights


if __name__ == '__main__':
    main()
