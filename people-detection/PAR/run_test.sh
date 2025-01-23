#######################################################################################
#Command line to run main.py in test mode
#Output: 
#out.csv -> image path + attributes inferences. With comma separator. 
#######################################################################################

CHECKPOINT_PATH='your_pathpeta/inception_iccv/61.pth.tar'
EXPERIMENT=gender
VAL_ANNOTATIONS='stuff/data_list/dk/val_dk.txt'
DATA_PATH='stuff/raw_data/dk_images'
TRAIN_ANNOTATIONS='stuff/data_list/dk/train_dk.txt'
MODEL_PATH='stuff/pretrained_model/bn_inception-52deb4733.pth'
GENERATE_FILE=True
EPOCHS=80
SAVE_FREQ=10

python main.py --approach=inception_iccv --experiment=$EXPERIMENT --model_path=$MODEL_PATH \
--train_list_path=$TRAIN_ANNOTATIONS --val_list_path=$VAL_ANNOTATIONS --data_path=$DATA_PATH \
--generate_file=$GENERATE_FILE --evaluate --resume=$CHECKPOINT_PATH