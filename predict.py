"""
Quick prediction script: python predict.py <image_path>
"""
import sys
import os
import torch
import numpy as np
from PIL import Image

from models.resnet152 import load_model, CLASSES
from utils.gradcam import GradCAM, apply_heatmap
from utils.transforms import inference_transform


def predict(image_path, save_heatmap=True):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = load_model('models/classifier.pt', device)
    grad_cam = GradCAM(model, model.layer4[-1])

    img = Image.open(image_path).convert('RGB')
    tensor = inference_transform(img).unsqueeze(0).to(device)
    cam, pred_class, confidence, probs = grad_cam.generate(tensor)

    print(f"Prediction: {CLASSES[pred_class]} ({confidence*100:.1f}%)")
    print(f"Probabilities:")
    for i, c in enumerate(CLASSES):
        print(f"  {c}: {probs[i]*100:.1f}%")

    if save_heatmap:
        img_np = np.array(img.resize((224, 224))) / 255.0
        overlay = apply_heatmap(img_np, cam)
        out_path = os.path.splitext(image_path)[0] + '_gradcam.png'
        Image.fromarray(overlay).save(out_path)
        print(f"Heatmap saved: {out_path}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)
    predict(sys.argv[1])
