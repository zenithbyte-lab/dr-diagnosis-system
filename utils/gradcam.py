"""
Grad-CAM: Gradient-weighted Class Activation Mapping.
Generates attention heatmaps showing where the model focuses for each prediction.
"""
import torch
import torch.nn.functional as F
import numpy as np
import cv2


class GradCAM:

    def __init__(self, model, target_layer):
        self.model = model
        self.gradients = None
        self.activations = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, target_class=None):
        self.model.eval()
        input_tensor.requires_grad_(True)
        output = self.model(input_tensor)
        probs = torch.exp(output)

        if target_class is None:
            target_class = probs.argmax(dim=1).item()
        confidence = probs[0, target_class].item()
        probs_np = probs.detach().cpu().numpy()[0]

        self.model.zero_grad()
        output[0, target_class].backward()

        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = F.relu((weights * self.activations).sum(dim=1, keepdim=True))
        cam = F.interpolate(cam, size=input_tensor.shape[2:], mode='bilinear', align_corners=False)
        cam = cam.squeeze().detach().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam, target_class, confidence, probs_np


def apply_heatmap(image_np, heatmap, alpha=0.4):
    """Overlay heatmap on image. image_np: [H,W,3] in [0,1], heatmap: [H,W] in [0,1]."""
    colored = cv2.applyColorMap((heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET)
    colored = cv2.cvtColor(colored, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    overlay = np.clip(image_np * (1 - alpha) + colored * alpha, 0, 1)
    return (overlay * 255).astype(np.uint8)
