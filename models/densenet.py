"""
DenseNet-121 dense convolutional network for DR 5-class grading (used for model comparison).
"""
import torch.nn as nn
from torchvision import models


def build_densenet121(num_classes=5, pretrained=True):
    weights = models.DenseNet121_Weights.DEFAULT if pretrained else None
    model = models.densenet121(weights=weights)
    num_ftrs = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_ftrs, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes)
    )
    return model
