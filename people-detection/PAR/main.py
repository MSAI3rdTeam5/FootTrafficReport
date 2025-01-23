import argparse
import os
import shutil
import time
import sys
import numpy as np
import logging
import pandas as pd
from numpy.random import randint
from attributes import df_attributes
import csv

import numpy as np
import torch
import torch.nn as nn
import torch.nn.parallel
import torch.backends.cudnn as cudnn
import torch.optim
import model as models
from torchinfo import summary

from torch.utils.tensorboard import SummaryWriter

# default `log_dir` is "runs" - we'll be more specific here
writer = SummaryWriter('stuff/runs/gender_iccv_peta_dk')

from utils.datasets import Get_Dataset

parser = argparse.ArgumentParser(description='Pedestrian Attribute Framework')
parser.add_argument('--experiment', default='rap', type=str, required=True, help='(default=%(default)s)')
parser.add_argument('--approach', default='inception_iccv', type=str, required=True, help='(default=%(default)s)')
parser.add_argument('--epochs', default=45, type=int, required=False, help='(default=%(default)d)')
parser.add_argument('--batch_size', default=32, type=int, required=False, help='(default=%(default)d)')
parser.add_argument('--lr', '--learning-rate', default=0.0001, type=float, required=False, help='(default=%(default)f)')
parser.add_argument('--optimizer', default='adam', type=str, required=False, help='(default=%(default)s)')
parser.add_argument('--momentum', default=0.9, type=float, required=False, help='(default=%(default)f)')
parser.add_argument('--weight_decay', default=0.0005, type=float, required=False, help='(default=%(default)f)')
parser.add_argument('--start-epoch', default=0, type=int, required=False, help='(default=%(default)d)')
parser.add_argument('--print_freq', default=100, type=int, required=False, help='(default=%(default)d)')
parser.add_argument('--save_freq', default=10, type=int, required=False, help='(default=%(default)d)')
parser.add_argument('--resume', default='', type=str, required=False, help='(default=%(default)s)')
parser.add_argument('--model_path', default='', type=str, required=False, help='Path to backbone model')
parser.add_argument('--decay_epoch', default=(45,60), type=eval, required=False, help='(default=%(default)d)')
parser.add_argument('--prefix', default='', type=str, required=False, help='(default=%(default)s)')
parser.add_argument('--data_path', type=str, required=False, help='path to the dataset root')
parser.add_argument('--train_list_path', type=str, required=False, help='path to the train annotations')
parser.add_argument('--val_list_path', type=str, required=False, help='path to the train annotations')
parser.add_argument('-e', '--evaluate', dest='evaluate', action='store_true', required=False, help='evaluate model on validation set')
parser.add_argument('--generate_file', default=False, type=bool,required=False, help='Generate a file with inferences for each image')

# Level of warnings
logging.basicConfig(format='[%(levelname)s]: %(message)s', level=logging.INFO) 

# Seed
np.random.seed(1)
torch.manual_seed(1)
if torch.cuda.is_available(): torch.cuda.manual_seed(1)
else: print('[CUDA unavailable]'); sys.exit()
best_accu = 0
EPS = 1e-12

#####################################################################################################


def main():
    global args, best_accu
    args = parser.parse_args()

    print('=' * 100)
    print('Arguments = ')
    for arg in vars(args):
        print('\t' + arg + ':', getattr(args, arg))
    print('=' * 100)

    # Data loading code

    if args.generate_file:
        train_dataset, val_dataset, attr_num, description , image_path= Get_Dataset(args.experiment, args.approach, args.data_path, args.train_list_path, args.val_list_path, args.generate_file)
    else:
        train_dataset, val_dataset, attr_num, description = Get_Dataset(args.experiment, args.approach, args.data_path, args.train_list_path, args.val_list_path, args.generate_file)

    logging.info('train_dataset at main: {}'.format((train_dataset))) 
    train_loader = torch.utils.data.DataLoader(
        train_dataset,
        batch_size=args.batch_size, shuffle=True, num_workers=4, pin_memory=True)
    # num workers: How many subprocesses to use
    val_loader = torch.utils.data.DataLoader(
        val_dataset,
        batch_size=32, shuffle=False, num_workers=4, pin_memory=True)

    # create model
    model = models.__dict__[args.approach](args.model_path, pretrained=True, num_classes=attr_num)

    # get the number of model parameters
    print('Number of model parameters: {}'.format(
        sum([p.data.nelement() for p in model.parameters()])))
    print('')

    # for training on multiple GPUs.
    # Use CUDA_VISIBLE_DEVICES=0,1 to specify which GPUs to use
    model = torch.nn.DataParallel(model).cuda()

    # optionally resume from a checkpoint
    if args.resume:
        if os.path.isfile(args.resume):
            print("=> loading checkpoint '{}'".format(args.resume))
            checkpoint = torch.load(args.resume)
            logging.debug('Values in checkpoint: {}'.format(checkpoint))
            args.start_epoch = checkpoint['epoch']
            best_accu = checkpoint['best_accu']
            model.load_state_dict(checkpoint['state_dict'])
            print("=> loaded checkpoint '{}' (epoch {})"
                  .format(args.resume, checkpoint['epoch']))
        else:
            print("=> no checkpoint found at '{}'".format(args.resume))
    #logging.info('Model Summary: : {}'.format((summary(model, input_size=(32, 3, 256, 128))))) 
    #TODO check if we can use the best algorithms for our hadware because the input size is fixed. benchmark = True
    cudnn.benchmark = False
    cudnn.deterministic = True

    # define loss function
    criterion = Weighted_BCELoss(args.experiment)

    if args.optimizer == 'adam':
        optimizer = torch.optim.Adam(model.parameters(), lr=args.lr,
                                    betas=(0.9, 0.999),
                                    weight_decay=args.weight_decay)
    else:
        optimizer = torch.optim.SGD(model.parameters(), args.lr,
                                    momentum=args.momentum,
                                    weight_decay=args.weight_decay)
    

    if args.evaluate:
        if args.generate_file:
            num_correct_pred = test_and_generate_attributes_file(val_loader, model, attr_num, description,image_path)
            logging.critical('Total Correct Inferences: {}'.format((num_correct_pred))) 
            return
        else:
            test(val_loader, model, attr_num, description)
            return 

    file = open("training_data.csv","w")
    file.truncate(0)
    file.close()

    file = open("val_data.csv","w")
    file.truncate(0)
    file.close()
    for epoch in range(args.start_epoch, args.epochs):
        adjust_learning_rate(optimizer, epoch, args.decay_epoch)

        # train for one epoch
        #train(train_loader, model, criterion, optimizer, epoch, running_loss)
        train(train_loader, model, criterion, optimizer, epoch)    
        # evaluate on validation set
        accu = validate(val_loader, model, criterion, epoch)

        test(val_loader, model, attr_num, description)

        # remember best Accu and save checkpoint
        is_best = accu > best_accu
        best_accu = max(accu, best_accu)

        if epoch in args.decay_epoch:
            save_checkpoint({
                'epoch': epoch + 1,
                'state_dict': model.state_dict(),
                'best_accu': best_accu,
            }, epoch+1, args.prefix)

def train(train_loader, model, criterion, optimizer, epoch):
    """Train for one epoch on the training set"""
    
        

    batch_time = AverageMeter()
    losses = AverageMeter()
    top1 = AverageMeter()
    model.train()
    end = time.time()
    #employee_writer = csv.writer(employee_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    with open('training_data.csv', mode='a') as training_data_file:
        fieldnames = ['epoch', 'Train_loss', 'Train_acc']    
        training_data_writer = csv.DictWriter(training_data_file, fieldnames = fieldnames)


        for i, _ in enumerate(train_loader):
            input, target = _
            target = target.cuda(non_blocking=True)
            input = input.cuda(non_blocking=True)
            output = model(input)

            bs = target.size(0)

            if type(output) == type(()) or type(output) == type([]):
                loss_list = []
                # deep supervision
                for k in range(len(output)):
                    out = output[k]
                    loss_list.append(criterion.forward(torch.sigmoid(out), target, epoch))
                loss = sum(loss_list)
                #TODO What is maximum voting?
                # maximum voting
                output = torch.max(torch.max(torch.max(output[0],output[1]),output[2]),output[3])
            else:
                loss = criterion.forward(torch.sigmoid(output), target, epoch)



            # measure accuracy and record loss
            accu = accuracy(output.data, target)
            losses.update(loss.data, bs)
            top1.update(accu, bs)

            # compute gradient and do SGD step
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            # measure elapsed time
            batch_time.update(time.time() - end)
            end = time.time()

            if i % args.print_freq == 0:               
                #training_data_writer.writerow({'epoch' : epoch, 'Train_loss':losses.val,'Train_acc': top1.val})
                training_data_writer.writerow({'epoch' : epoch, 'Train_loss':losses.val.cpu().numpy(),'Train_acc': top1.val})
                print('Epoch: [{0}][{1}/{2}]\t'
                    'Time {batch_time.val:.3f} ({batch_time.avg:.3f})\t'
                    'Loss {loss.val:.4f} ({loss.avg:.4f})\t'
                    'Accu {top1.val:.3f} ({top1.avg:.3f})'.format(
                        epoch, i, len(train_loader), batch_time=batch_time,
                        loss=losses, top1=top1))
    


def validate(val_loader, model, criterion, epoch):
    """Perform validation on the validation set"""

    batch_time = AverageMeter()
    losses = AverageMeter()
    top1 = AverageMeter()
    model.eval()
    end = time.time()


    with open('val_data.csv', mode='a') as validating_data_file:
        fieldnames = ['epoch', 'Val_loss', 'Val_acc']
        validating_data_writer = csv.DictWriter(validating_data_file, delimiter=',', fieldnames = fieldnames)



        for i, _ in enumerate(val_loader):
            input, target = _
            target = target.cuda(non_blocking=True)
            input = input.cuda(non_blocking=True)
            output = model(input)

            bs = target.size(0)

            if type(output) == type(()) or type(output) == type([]):
                loss_list = []
                # deep supervision
                for k in range(len(output)):
                    out = output[k]
                    loss_list.append(criterion.forward(torch.sigmoid(out), target, epoch))
                loss = sum(loss_list)
                # maximum voting
                output = torch.max(torch.max(torch.max(output[0],output[1]),output[2]),output[3])
            else:
                loss = criterion.forward(torch.sigmoid(output), target, epoch)

            
            accu = accuracy(output.data, target)
            losses.update(loss.data, bs)
            top1.update(accu, bs)

            # measure elapsed time
            batch_time.update(time.time() - end)
            end = time.time()

            if i % args.print_freq == 0:
                validating_data_writer.writerow({'epoch' : epoch, 'Val_loss':losses.val.cpu().numpy(),'Val_acc': top1.val})
                print('Test: [{0}/{1}]\t'
                    'Time {batch_time.val:.3f} ({batch_time.avg:.3f})\t'
                    'Loss {loss.val:.4f} ({loss.avg:.4f})\t'
                    'Accu {top1.val:.3f} ({top1.avg:.3f})'.format(
                        i, len(val_loader), batch_time=batch_time, loss=losses,
                        top1=top1))

    print(' * Accu {top1.avg:.3f}'.format(top1=top1))
    return top1.avg


def test(val_loader, model, attr_num, description):

    model.eval()

    pos_cnt = []
    pos_tol = []
    neg_cnt = []
    neg_tol = []

    accu = 0.0
    prec = 0.0
    recall = 0.0
    tol = 0

    # get some random validation images
    dataiter = iter(val_loader)
    images, _ = dataiter.next()

    writer.add_graph(model, images)
    writer.close()

    for it in range(attr_num):
        pos_cnt.append(0)
        pos_tol.append(0)
        neg_cnt.append(0)
        neg_tol.append(0)

    for i, _ in enumerate(val_loader):
        input, target = _  # input = [_, 3, 243, 258] target = [_,35]
        target = target.cuda(non_blocking=True)
        input = input.cuda(non_blocking=True)
        output = model(input)
        bs = target.size(0)

        # maximum voting
        # output = [4, _, 35]
        if type(output) == type(()) or type(output) == type([]):
            output = torch.max(torch.max(torch.max(output[0],output[1]),output[2]),output[3])


        batch_size = target.size(0)
        tol = tol + batch_size
        #output = (_, 35)
        output = torch.sigmoid(output.data).cpu().numpy()
        output = np.where(output > 0.5, 1, 0)
        #target = [_,35]
        target = target.cpu().numpy()

        for it in range(attr_num):
            for jt in range(batch_size):
                if target[jt][it] == 1:
                    pos_tol[it] = pos_tol[it] + 1
                    if output[jt][it] == 1:
                        pos_cnt[it] = pos_cnt[it] + 1
                if target[jt][it] == 0:
                    neg_tol[it] = neg_tol[it] + 1
                    if output[jt][it] == 0:
                        neg_cnt[it] = neg_cnt[it] + 1

        if attr_num == 1:
            continue
        for jt in range(batch_size):
            tp = 0
            fn = 0
            fp = 0
            for it in range(attr_num):
                if output[jt][it] == 1 and target[jt][it] == 1:
                    tp = tp + 1
                elif output[jt][it] == 0 and target[jt][it] == 1:
                    fn = fn + 1
                elif output[jt][it] == 1 and target[jt][it] == 0:
                    fp = fp + 1
            if tp + fn + fp != 0:
                accu = accu +  1.0 * tp / (tp + fn + fp)
            if tp + fp != 0:
                prec = prec + 1.0 * tp / (tp + fp)
            if tp + fn != 0:
                recall = recall + 1.0 * tp / (tp + fn)

    print('=' * 100)
    print('\t     Attr              \tp_true/n_true\tp_tol/n_tol\tp_pred/n_pred\tcur_mA')
    mA = 0.0
    for it in range(attr_num):
        logging.info('Value of pos_tol: {} and value of neg_tol: {}'.format(pos_tol[it], neg_tol[it]))
        cur_mA = ((1.0*pos_cnt[it]/pos_tol[it]) + (1.0*neg_cnt[it]/neg_tol[it])) / 2.0
        mA = mA + cur_mA
        print('\t#{:2}: {:18}\t{:4}\{:4}\t{:4}\{:4}\t{:4}\{:4}\t{:.5f}'.format(it,description[it],pos_cnt[it],neg_cnt[it],pos_tol[it],neg_tol[it],(pos_cnt[it]+neg_tol[it]-neg_cnt[it]),(neg_cnt[it]+pos_tol[it]-pos_cnt[it]),cur_mA))
    mA = mA / attr_num
    print('\t' + 'mA:        '+str(mA))

    if attr_num != 1:
        accu = accu / tol
        prec = prec / tol
        recall = recall / tol
        f1 = 2.0 * prec * recall / (prec + recall)
        print('\t' + 'Accuracy:  '+str(accu))
        print('\t' + 'Precision: '+str(prec))
        print('\t' + 'Recall:    '+str(recall))
        print('\t' + 'F1_Score:  '+str(f1))
    print('=' * 100)

def test_and_generate_attributes_file(val_loader, model, attr_num, description,image_path):
    '''
    Input: 
    val_loader: loader of validation data
    Model: model to test
    attr_num: Number of attributes of each image
    description: Attribute names 
    Output:
    out.csv -> csv file with name + attribute inferences
   
    '''
    model.eval()
    count = 0
    num_correct_pred = 0
    gender_attribute=16
    
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
        output = torch.sigmoid(output.data).cpu().numpy()
        output = np.where(output > 0.5, 1, 0)
        target = target.cpu().numpy()
        
        ##Generate the list Annotations for all images: [attributes]
        for jt in range(batch_size):
            logging.debug('Inferences: {}'.format((output[jt][gender_attribute]))) 
            row = [image_path[count]] + list(map(str,output[jt][:]))
            logging.info('Values in row: {}'.format(row))
            df_attributes.loc[count] = row
            count +=1

            if output[jt][gender_attribute] == target[jt][gender_attribute]:
                num_correct_pred+=1
    
    df_attributes.to_csv('Inference_result.csv',index=False)
            
    return num_correct_pred        
            

def save_checkpoint(state, epoch, prefix, filename='.pth.tar'):
    """Saves checkpoint to disk"""
    directory = "your_path" + args.experiment + '/' + args.approach + '/'
    if not os.path.exists(directory):
        os.makedirs(directory)
    if prefix == '':
        filename = directory + str(epoch) + filename
    else:
        filename = directory + prefix + '_' + str(epoch) + filename
    torch.save(state, filename)

class AverageMeter(object):
    """Computes and stores the average and current value"""
    def __init__(self):
        self.reset()

    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0

    def update(self, val, n=1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count

def adjust_learning_rate(optimizer, epoch, decay_epoch):
    lr = args.lr
    for epc in decay_epoch:
        if epoch >= epc:
            lr = lr * 0.1
        else:
            break
    print()
    print('Learning Rate:', lr)
    print()
    for param_group in optimizer.param_groups:
        param_group['lr'] = lr


def accuracy(output, target):
    batch_size = target.size(0)
    attr_num = target.size(1)

    output = torch.sigmoid(output).cpu().numpy()
    output = np.where(output > 0.5, 1, 0)
    pred = torch.from_numpy(output).long()
    target = target.cpu().long()
    correct = pred.eq(target)
    correct = correct.numpy()

    res = []
    for k in range(attr_num):
        res.append(1.0*sum(correct[:,k]) / batch_size)
    return sum(res) / attr_num


class Weighted_BCELoss(object):
    """
        Weighted_BCELoss was proposed in "Multi-attribute learning for pedestrian attribute recognition in surveillance scenarios"[13].
        weight of l-th parameter = exp(-p_l / sigma^2) where p_l is the positive ratio l-th attributre in the training set
    """
    def __init__(self, experiment):
        super(Weighted_BCELoss, self).__init__()
        self.weights = None
        if experiment == 'pa100k':
            self.weights = torch.Tensor([0.460444444444,
                                        0.0134555555556,
                                        0.924377777778,
                                        0.0621666666667,
                                        0.352666666667,
                                        0.294622222222,
                                        0.352711111111,
                                        0.0435444444444,
                                        0.179977777778,
                                        0.185,
                                        0.192733333333,
                                        0.1601,
                                        0.00952222222222,
                                        0.5834,
                                        0.4166,
                                        0.0494777777778,
                                        0.151044444444,
                                        0.107755555556,
                                        0.0419111111111,
                                        0.00472222222222,
                                        0.0168888888889,
                                        0.0324111111111,
                                        0.711711111111,
                                        0.173444444444,
                                        0.114844444444,
                                        0.006]).cuda()
        elif experiment == 'rap':
            self.weights = torch.Tensor([0.311434,
                                        0.009980,
                                        0.430011,
                                        0.560010,
                                        0.144932,
                                        0.742479,
                                        0.097728,
                                        0.946303,
                                        0.048287,
                                        0.004328,
                                        0.189323,
                                        0.944764,
                                        0.016713,
                                        0.072959,
                                        0.010461,
                                        0.221186,
                                        0.123434,
                                        0.057785,
                                        0.228857,
                                        0.172779,
                                        0.315186,
                                        0.022147,
                                        0.030299,
                                        0.017843,
                                        0.560346,
                                        0.000553,
                                        0.027991,
                                        0.036624,
                                        0.268342,
                                        0.133317,
                                        0.302465,
                                        0.270891,
                                        0.124059,
                                        0.012432,
                                        0.157340,
                                        0.018132,
                                        0.064182,
                                        0.028111,
                                        0.042155,
                                        0.027558,
                                        0.012649,
                                        0.024504,
                                        0.294601,
                                        0.034099,
                                        0.032800,
                                        0.091812,
                                        0.024552,
                                        0.010388,
                                        0.017603,
                                        0.023446,
                                        0.128917]).cuda()
        elif experiment == 'peta':
            self.weights = torch.Tensor([0.3033,
                                         0.4417,
                                         0.1783,
                                         0.0667,
                                         0.0667,
                                         0.2633,
                                         0.895, 
                                         0.9183, 
                                         0.0967, 
                                         0.0733, 
                                         0.04, 
                                         0.1783, 
                                         0.2433, 
                                         0.16, 
                                         0.03, 
                                         0.34, 
                                         0.575, 
                                         0.0667, 
                                         0.0017, 
                                         0.9167, 
                                         0.6317, 
                                         0.0233, 
                                         0.045, 
                                         0.0083, 
                                         0.6117, 
                                         0.0017, 
                                         0.2233, 
                                         0.025, 
                                         0.1383, 
                                         0.0183, 
                                         0.0283, 
                                         0.6333, 
                                         0.1683, 
                                         0.345,
                                         0.0367]).cuda()
        elif experiment == 'gender':
            self.weights = torch.Tensor([0.5016,
                                        0.3275,
                                        0.1023,
                                        0.0597,
                                        0.1986,
                                        0.2011,
                                        0.8643,
                                        0.8559,
                                        0.1342,
                                        0.1297,
                                        0.1014,
                                        0.0685,
                                        0.314,
                                        0.2932,
                                        0.04,
                                        0.2346,
                                        0.5473,
                                        0.2974,
                                        0.0849,
                                        0.7523,
                                        0.2717,
                                        0.0282,
                                        0.0749,
                                        0.0191,
                                        0.3633,
                                        0.0359,
                                        0.1425,
                                        0.0454,
                                        0.2201,
                                        0.0178,
                                        0.0285,
                                        0.5125,
                                        0.0838,
                                        0.4605,
                                        0.0124]).cuda()
        else:
            self.weights = None

    def forward(self, output, target, epoch):
        if self.weights is not None:
            
            cur_weights = torch.exp(target + (1 - target * 2) * self.weights)
            loss = cur_weights *  (target * torch.log(output + EPS)) + ((1 - target) * torch.log(1 - output + EPS))
        else:
            loss = target * torch.log(output + EPS) + (1 - target) * torch.log(1 - output + EPS)
        return torch.neg(torch.mean(loss))

if __name__ == '__main__':
    main()
