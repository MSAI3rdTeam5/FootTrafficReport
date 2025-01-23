'''
Script to copy images to their respective folder
Input: 
--path : Path of JSON annottations file
Output:
Move the images to their respective folder
'''
import argparse
import json
import logging
import os
import shutil
parser = argparse.ArgumentParser(description='Image relocator')
parser.add_argument('--path',  type=str, required=True, help='Path to JSON file')

# Level of warnings
logging.basicConfig(format='[%(levelname)s]: %(message)s', level=logging.INFO) 

def image_relocator(path):
    with open(path) as json_file:
        data = json.load(json_file)
        #print(data)
        #Create a folder for each label
        for label in data['labels']:
          try:
            os.mkdir(label)
          except:
            pass
        for key,value in data['annotations'].items():
            path, file_name = os.path.split(key)
            target = os.path.join(value[0]['label'],file_name)
            print(target)
            shutil.copy(key,target)
            

        #print('type: ', type(data['annotations']))
def main():
    global args
    args = parser.parse_args()
    path = args.path
    image_relocator(path)

if __name__ == '__main__':
    main()