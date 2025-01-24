import torch
import torchvision.models as models
from torchvision import transforms
from PIL import Image

class FeatureExtractor:
    def __init__(self, model_path):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = models.resnet18(pretrained=False)
        self.model.load_state_dict(torch.load(model_path))
        self.model = self.model.to(self.device).eval()
        self.transform = transforms.Compose([
            transforms.Resize((128, 128)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def extract(self, image):
        """
        이미지로부터 특징 벡터를 추출합니다.
        Args:
            image (PIL.Image): 입력 이미지
        Returns:
            feature (torch.Tensor): 특징 벡터
        """
        image = self.transform(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            feature = self.model(image)
        return feature.cpu().numpy()
