"""
ResNet-152 residual convolutional network for DR 5-class grading.
Pre-trained on ImageNet, fine-tuned for diabetic retinopathy.
"""
import torch
from torch import nn
from torchvision import models

CLASSES = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR']
MODEL_PATH = 'models/classifier.pt'


def build_resnet152(num_classes=5):
    model = models.resnet152(weights=None)
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_ftrs, 512),
        nn.ReLU(),
        nn.Linear(512, num_classes),
        nn.LogSoftmax(dim=1)
    )
    return model


def load_model(path=MODEL_PATH, device=None):
    if device is None:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = build_resnet152()
    checkpoint = torch.load(path, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    return model
