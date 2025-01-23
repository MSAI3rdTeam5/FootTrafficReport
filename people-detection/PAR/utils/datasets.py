import os
import sys
from PIL import Image
import torch
import numpy as np
import torch.utils.data as data
import torchvision.transforms as transforms
import torchvision.datasets as datasets
import logging
import imgaug
import imgaug.augmenters as iaa





def default_loader(path):
    return Image.open(path).convert('RGB')
class MultiLabelDataset(data.Dataset):
    '''
    Load a multi label data.
    input: dataset of images and its labels
    '''
    def __init__(self, root, label, transform = None, loader = default_loader):
        images = []
        # labels = open(label).read()
        labels = open(label).readlines()
        for idx, line in enumerate(labels):
            items = line.split()
            img_name = items.pop(0)
            logging.info('img_name on MultiLabelDataset init: {}, and line: {}'.format(img_name, idx)) 
            if os.path.isfile(os.path.join(root, img_name)):
                cur_label = tuple([int(v) for v in items])
                images.append((img_name, cur_label))
            else:
                print(os.path.join(root, img_name) + 'Not Found.')
            
        self.root = root
        self.images = images
        self.transform = transform
        self.loader = loader
        

    def __getitem__(self, index):
        img_name, label = self.images[index]
        img = self.loader(os.path.join(self.root, img_name))
        raw_img = img.copy()
        if self.transform is not None:
            img = self.transform(img)
        return img, torch.Tensor(label)

    def __len__(self):
        return len(self.images)


attr_nums = {}
attr_nums['pa100k'] = 26
attr_nums['rap'] = 51
attr_nums['peta'] = 35

description = {}
description['pa100k'] = ['Female',
                        'AgeOver60',
                        'Age18-60',
                        'AgeLess18',
                        'Front',
                        'Side',
                        'Back',
                        'Hat',
                        'Glasses',
                        'HandBag',
                        'ShoulderBag',
                        'Backpack',
                        'HoldObjectsInFront',
                        'ShortSleeve',
                        'LongSleeve',
                        'UpperStride',
                        'UpperLogo',
                        'UpperPlaid',
                        'UpperSplice',
                        'LowerStripe',
                        'LowerPattern',
                        'LongCoat',
                        'Trousers',
                        'Shorts',
                        'Skirt&Dress',
                        'boots']

description['peta'] = ['Age16-30',
                        'Age31-45',
                        'Age46-60',
                        'AgeAbove61',
                        'Backpack',
                        'CarryingOther',
                        'Casual lower',
                        'Casual upper',
                        'Formal lower',
                        'Formal upper',
                        'Hat',
                        'Jacket',
                        'Jeans',
                        'Leather Shoes',
                        'Logo',
                        'Long hair',
                        'Male',
                        'Messenger Bag',
                        'Muffler',
                        'No accessory',
                        'No carrying',
                        'Plaid',
                        'PlasticBags',
                        'Sandals',
                        'Shoes',
                        'Shorts',
                        'Short Sleeve',
                        'Skirt',
                        'Sneaker',
                        'Stripes',
                        'Sunglasses',
                        'Trousers',
                        'Tshirt',
                        'UpperOther',
                        'V-Neck']

description['rap'] = ['Female',
                        'AgeLess16',
                        'Age17-30',
                        'Age31-45',
                        'BodyFat',
                        'BodyNormal',
                        'BodyThin',
                        'Customer',
                        'Clerk',
                        'BaldHead',
                        'LongHair',
                        'BlackHair',
                        'Hat',
                        'Glasses',
                        'Muffler',
                        'Shirt',
                        'Sweater',
                        'Vest',
                        'TShirt',
                        'Cotton',
                        'Jacket',
                        'Suit-Up',
                        'Tight',
                        'ShortSleeve',
                        'LongTrousers',
                        'Skirt',
                        'ShortSkirt',
                        'Dress',
                        'Jeans',
                        'TightTrousers',
                        'LeatherShoes',
                        'SportShoes',
                        'Boots',
                        'ClothShoes',
                        'CasualShoes',
                        'Backpack',
                        'SSBag',
                        'HandBag',
                        'Box',
                        'PlasticBag',
                        'PaperBag',
                        'HandTrunk',
                        'OtherAttchment',
                        'Calling',
                        'Talking',
                        'Gathering',
                        'Holding',
                        'Pusing',
                        'Pulling',
                        'CarryingbyArm',
                        'CarryingbyHand']

class MultiLabelDatasetOnlyForTest(MultiLabelDataset):
    '''
    Attributes:
    root -> Images root path
    images -> Image name + attributes
    transform -> Transformation defined in class Get_Dataset
    loader -> Loader defined in Main
    images_path -> Relative to root images path

    Methods:

    get_Images_path -> Output: Return the relative to root images path
    '''
    def __init__(self, root, label, transform = None, loader = default_loader, images_path = None):
        images = []
        images_path = []
        labels = open(label).readlines()

        for line in labels:
            items = line.split()
            img_name = items.pop(0)
            if os.path.isfile(os.path.join(root, img_name)):
                cur_label = tuple([int(v) for v in items])
                images.append((img_name, cur_label))
                images_path.append((os.path.join(root, img_name)))
            else:
                print(os.path.join(root, img_name) + 'Not Found.')
        self.root = root
        self.images = images
        self.transform = transform
        self.loader = loader
        self.images_path = images_path
        

    def __getitem__(self, index):
        img_name, label = self.images[index]
        #img_path = self.images_path[index]
        img = self.loader(os.path.join(self.root, img_name))
        raw_img = img.copy()
        if self.transform is not None:
            img = self.transform(img)
        return img, torch.Tensor(label)

    def __len__(self):
        return len(self.images)
    
    def get_Images_Path(self):
        return self.images_path

    



def Get_Dataset(experiment, approach, data_path, train_list_path, val_list_path,generate_file):

    #TODO Check what happen if we change the value for the Normalization
    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    transform_train = transforms.Compose([
        transforms.Resize(size=(256, 128)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(hue=.05, saturation=.05, brightness=0.1, contrast=0.2),
        transforms.RandomRotation(20, resample=Image.BILINEAR),
        transforms.ToTensor(),
        normalize
        ])
    transform_test = transforms.Compose([
        transforms.Resize(size=(256, 128)),
        transforms.ToTensor(),
        normalize
        ])

    if experiment == 'pa100k':
        train_dataset = MultiLabelDataset(root=data_path,
                    label=train_list_path, transform=transform_train)
        val_dataset = MultiLabelDataset(root=data_path,
                    label=val_list_path, transform=transform_test)
        return train_dataset, val_dataset, attr_nums['pa100k'], description['pa100k']
    elif experiment == 'rap':
        train_dataset = MultiLabelDataset(root=data_path,
                    label=train_list_path, transform=transform_train)
        val_dataset = MultiLabelDataset(root=data_path,
                    label=val_list_path, transform=transform_test)
        return train_dataset, val_dataset, attr_nums['rap'], description['rap']
    elif experiment == 'peta':
        train_dataset = MultiLabelDataset(root=data_path,
                    label=train_list_path, transform=transform_train)
        val_dataset = MultiLabelDataset(root=data_path,
                    label=val_list_path, transform=transform_test)
        return train_dataset, val_dataset, attr_nums['peta'], description['peta']

    elif experiment == 'gender':
        '''
        Branch only for Gender experiment. This branch will be followed with the run_test.sh configuration. 
        '''
        if generate_file:
            val_dataset = MultiLabelDatasetOnlyForTest(root=data_path,
                        label=val_list_path, transform=transform_test)
            train_dataset = MultiLabelDatasetOnlyForTest(root=data_path,
                        label=train_list_path, transform=transform_train)
            data = MultiLabelDatasetOnlyForTest(root=data_path,
                        label=val_list_path, transform=transform_train)
            images_path = data.get_Images_Path()

            return train_dataset, val_dataset, attr_nums['peta'], description['peta'],images_path

        else:
            train_dataset = MultiLabelDataset(root=data_path,
                        label=train_list_path, transform=transform_train)
            val_dataset = MultiLabelDataset(root=data_path,
                        label=val_list_path, transform=transform_test)
            return train_dataset, val_dataset, attr_nums['peta'], description['peta']
