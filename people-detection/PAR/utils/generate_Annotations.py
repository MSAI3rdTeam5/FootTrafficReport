import os

def generate_attribute_annotation(path):

  #Dir = '/content/iccv19_attribute/data_list/GenderDataSet/men'
  annotation_Dir = '/home/ubuntu/gender_repos/iccv19_attribute/raw_data/Gender_annotation.txt'
  name = os.path.split(path)[-1]
  if name == 'men':
    f= open(annotation_Dir,"w+")
  elif name == 'women':
    f= open(annotation_Dir,"a+")
  path, dirs, files = next(os.walk(path))
  file_count = len(files)
  for fi in files:
    #print(fi)
    if name == 'men':
      #print(fi)
      toWrite = 'raw_data/men/'+fi+' '+'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0'
      f.write('\n')
      #print('toWrite')
      f.write(toWrite)
    if name == 'women':
      toWrite = 'raw_data/women/'+fi+' '+'1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1'
      f.write('\n')
      f.write(toWrite)
  
  f.close()


male = '/home/ubuntu/gender_repos/iccv19_attribute/raw_data/men'
female = '/home/ubuntu/gender_repos/iccv19_attribute/raw_data/women'
generate_attribute_annotation(male)
generate_attribute_annotation(female)