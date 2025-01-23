# Improving Pedestrian Attribute Recognition With Weakly-Supervised Multi-Scale Attribute-Specific Localization for Real Time Inference

Based on the original work of (Tang et al., 2019)
[[Paper]](https://arxiv.org/abs/1910.04562)

## Environment

- Python 3.6+
- PyTorch 0.4+

## Datasets

- RAP: http://rap.idealtest.org/
- PETA: http://mmlab.ie.cuhk.edu.hk/projects/PETA.html
- PA-100K: https://github.com/xh-liu/HydraPlus-Net
- Gender Dataset: raw_data

The original datasets should be processed to match the DataLoader.

We provide the label lists for training and testing.

## Training, Testing, and Visualization 

```
sh run_train.sh
```

```
sh run_test.sh
```
```
Execute utils/inferences_visualization.ipynb cells
```
## Update: Train
Perform a retrain with:
- Model located in CHECKPOINT_PATH
- Images root data path as DATA_PATH
- train and validation annotations located in TRAIN_ANNOTATIONS and VAL_ANNOTATIONS respectively
- 80 epochs
- save frequency equals 10

## Update: Test
Perform an inference with:
- Model located in CHECKPOINT_PATH
- Images root data path as DATA_PATH
- Validation annotations located in VAL_ANNOTATIONS<br />
Output:
- Inference_result.csv: Inference annotations for all images in VAL_ANNOTATIONS

## Update: Visualization
Display inference results from Test:
- input csv in csv_path.
- Fixed number of images to 145<br />
Output:
- 145 images with their inferences result and path as title.


## Pretrained Models

We provide the pretrained models for reference, the results may slightly different with the values reported in our paper.

| Dataset | mA    | Link                                                         |
| ------- | ----- | ------------------------------------------------------------ |
| PETA    | 86.34 | [Model](https://drive.google.com/file/d/1cvX43Qn_vydzT_jnmgwYUUe9hIA161PH/view?usp=sharing) |
| RAP     | 81.86 | [Model](https://drive.google.com/file/d/15paMK0-rKDsuzptDPK5kH2JuL8QO0HyS/view?usp=sharing) |
| PA-100K | 80.45 | [Model](https://drive.google.com/file/d/1xIw3jpvE1pDC3U464kcFJ58iSKCRNQ63/view?usp=sharing) |


