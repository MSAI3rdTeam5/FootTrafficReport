#######################################################################################
#Command line to run main.py in train mode 
#######################################################################################

CHECKPOINT_PATH='stuff/checkpoints/peta_epoch_31.pth'
EXPERIMENT=peta
#VAL_ANNOTATIONS='stuff/data_list/peta/PETA_test_list.txt'
#VAL_ANNOTATIONS='stuff/data_list/peta/PETA_val_list.txt'
VAL_ANNOTATIONS='stuff/data_list/dk/val_dk.txt'
#VAL_ANNOTATIONS='stuff/data_list/dk/train_dk.txt'
DATA_PATH='stuff/raw_data/dk_images'
# TRAIN_ANNOTATIONS='stuff/data_list/peta/PETA_train_list.txt'
TRAIN_ANNOTATIONS='stuff/data_list/dk/train_dk.txt'
#TRAIN_ANNOTATIONS='stuff/data_list/peta/PETA_val_list.txt'
MODEL_PATH='stuff/pretrained_model/bn_inception-52deb4733.pth'
#MODEL_PATH='your_pathpeta/inception_iccv/41.pth.tar'
GENERATE_FILE=True
EPOCHS=80
SAVE_FREQ=10

python main.py --approach=inception_iccv --experiment=$EXPERIMENT --model_path=$MODEL_PATH \
--train_list_path=$TRAIN_ANNOTATIONS --val_list_path=$VAL_ANNOTATIONS --data_path=$DATA_PATH \
--resume=$CHECKPOINT_PATH --epochs=$EPOCHS