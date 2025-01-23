import argparse
import os
import math
import shutil
import time
import sys
import numpy as np

import torch
import torch.nn as nn
import torch.nn.parallel
import torch.backends.cudnn as cudnn
import torch.optim
import model as models
from torchsummary import summary

#from utils.datasets import Get_Dataset
from utils.newdatasets import Get_Dataset
def test(val_loader, model, attr_num, description):
    print('val_loader: ', val_loader)
    model.eval()
    num_incorrect_pred = 0
    num_correct_pred = 0
    #pos_cnt = []
    #pos_tol = []
    #neg_cnt = []
    #neg_tol = []

    #accu = 0.0
    #prec = 0.0
    #recall = 0.0
    #tol = 0

   
    for i, _ in enumerate(val_loader):
        input, target = _
        target = target.cuda(non_blocking=True)
        input = input.cuda(non_blocking=True)
        output = model(input)
        bs = target.size(0)

        # maximum voting
        if type(output) == type(()) or type(output) == type([]):
            output = torch.max(torch.max(torch.max(output[0],output  [1]),output[2]),output[3])


        batch_size = target.size(0)
        #tol = tol + batch_size
        output = torch.sigmoid(output.data).cpu().numpy()
        output = np.where(output > 0.5, 1, 0)
        target = target.cpu().numpy()


        if attr_num == 1:
            continue
        
        #print('target: ', target)
        gender_Atribbute = 16
        for jt in range(batch_size):
          if (output[jt][gender_Atribbute] == target[jt][gender_Atribbute]):
            num_correct_pred += 1
          else:
            num_incorrect_pred +=1
            #suma += 1

          #print('Id: ',jt, description[gender_Atribbute], 'Inference : ',  output[jt][gender_Atribbute], ' target: ', target[jt][gender_Atribbute])
                    
    return num_correct_pred, num_incorrect_pred     
           
def main():
  
  modelPath = '/home/ubuntu/gender_repos/iccv19_attribute/model/bn_inception-52deb4733.pth'
  resume = '/home/ubuntu/gender_repos/iccv19_attribute/model/bn_inception-52deb4733.pth'
  start_epoch = 0
  optimizer = 'adam'
  lr = 0.0001
  momentum = 0.9
  weight_decay = 0.0005
  decay_epoch = (20,40)
  evaluate = True
  experiment = 'gender'
  approach = 'inception_iccv'


  model = models.__dict__['inception_iccv'](pretrained=True, num_classes=35)
  print('Number of model parameters: {}'.format(
      sum([p.data.nelement() for p in model.parameters()])))
  

  model = torch.nn.DataParallel(model).cuda()

  val_dataset, attr_num, description = Get_Dataset(experiment, approach)


  val_loader = torch.utils.data.DataLoader(
        val_dataset,
        batch_size=32, num_workers=8)

  print(len(val_loader))
  #for count, i in enumerate(val_loader):
  #  print(count , i)

  if modelPath:
          if os.path.isfile(resume):
              print("=> loading checkpoint '{}'".format(resume))
              checkpoint = torch.load(resume)
              start_epoch = checkpoint['epoch']
              best_accu = checkpoint['best_accu']
              model.load_state_dict(checkpoint['state_dict'])
              print("=> loaded checkpoint '{}' (epoch {})"
                    .format(resume, checkpoint['epoch']))
          else:
              print("=> no checkpoint found at '{}'".format(resume))

  cudnn.benchmark = False
  cudnn.deterministic = True

  # define loss function
  
  if evaluate:
    num_correct_pred, num_incorrect_pred = test(val_loader, model, attr_num, description)
    # print(model)
    summary(model, input_size=(3,256,128))
    print('Predicciones correctas = ',num_correct_pred , '/',num_incorrect_pred+num_correct_pred)
    print('Porcentaje de aciertos = ',(num_correct_pred/(num_incorrect_pred+num_correct_pred)))
    return

main()