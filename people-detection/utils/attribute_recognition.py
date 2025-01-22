import torch
import torch.nn as nn
from snntorch import surrogate, snn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np


class AttributeAnalysis:
    def __init__(self):
        self.model = self.create_snn_par_model()
        self.model.load_state_dict(torch.load('..\model\snn-par.pth', map_location=torch.device('cpu')))
        self.model.eval()
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def create_snn_par_model(self):
        beta = 0.5
        spike_grad = surrogate.fast_sigmoid()

        class SNNPAR(nn.Module):
            def __init__(self):
                super().__init__()
                self.conv1 = nn.Conv2d(3, 16, 5, stride=1, padding=2)
                self.lif1 = snn.Leaky(beta=beta, spike_grad=spike_grad)
                self.conv2 = nn.Conv2d(16, 32, 5, stride=1, padding=2)
                self.lif2 = snn.Leaky(beta=beta, spike_grad=spike_grad)
                self.fc1 = nn.Linear(32 * 56 * 56, 128)
                self.lif3 = snn.Leaky(beta=beta, spike_grad=spike_grad)
                self.fc2 = nn.Linear(128, 10)  # 10은 속성 수에 따라 조정

            def forward(self, x):
                num_steps = 100
                spk_rec = []
                
                for step in range(num_steps):
                    x = self.conv1(x)
                    spk, _ = self.lif1(x)
                    x = self.conv2(spk)
                    spk, _ = self.lif2(x)
                    x = spk.flatten(1)
                    x = self.fc1(x)
                    spk, _ = self.lif3(x)
                    x = self.fc2(spk)
                    spk_rec.append(x)

                return torch.stack(spk_rec, dim=0).mean(dim=0)  # 평균값 반환

        return SNNPAR()

    def analyze(self, bbox, frame):
        person_image = self.extract_person_image(bbox, frame)
        input_tensor = self.transform(person_image).unsqueeze(0)

        with torch.no_grad():
            outputs = self.model(input_tensor)

        attributes = self.interpret_outputs(outputs)
        return attributes

    def extract_person_image(self, bbox, frame):
        x1, y1, x2, y2 = map(int, bbox)
        
        # 프레임이 numpy 배열인지 확인
        if isinstance(frame, np.ndarray):
            person_image = frame[y1:y2, x1:x2]
            return Image.fromarray(person_image)
        else:
            raise ValueError("Frame must be a numpy array.")

    def interpret_outputs(self, outputs):
        # 출력을 해석하여 속성으로 변환
        attribute_scores = torch.sigmoid(outputs.squeeze())

        attributes = {
            'gender': 'Male' if attribute_scores[0] > 0.5 else 'Female',
            'age': self.interpret_age(attribute_scores[1:4]),
            'hat': 'Yes' if attribute_scores[4] > 0.5 else 'No',
            'bag': 'Yes' if attribute_scores[5] > 0.5 else 'No',
        }
        return attributes

    def interpret_age(self, age_scores):
        age_ranges = ['Child', 'Adult', 'Elderly']
        return age_ranges[age_scores.argmax().item()]
