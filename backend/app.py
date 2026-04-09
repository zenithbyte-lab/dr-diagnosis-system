"""
FastAPI backend for Diabetic Retinopathy Diagnosis System.
"""
import os
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import torch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models.resnet152 import load_model
from utils.gradcam import GradCAM, apply_heatmap
from utils.transforms import inference_transform
from .config import MODEL_PATH, UPLOAD_DIR, HEATMAP_DIR, PROJECT_ROOT
from .constants import CLASSES
from .database import engine, Base
from .routers import auth_router, diagnosis_router, report_router, admin_router

Base.metadata.create_all(bind=engine)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = load_model(MODEL_PATH, device)
grad_cam = GradCAM(model, model.layer4[-1])

inference_transform = inference_transform
apply_heatmap = apply_heatmap

app = FastAPI(title="DR Diagnosis System", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(auth_router.router)
app.include_router(diagnosis_router.router)
app.include_router(report_router.router)
app.include_router(admin_router.router)

app.mount("/files/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/files/heatmaps", StaticFiles(directory=HEATMAP_DIR), name="heatmaps")

# Serve pre-built frontend from static/
STATIC_DIR = os.path.join(PROJECT_ROOT, "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="frontend-assets")

    @app.get("/favicon.svg")
    def favicon():
        return FileResponse(os.path.join(STATIC_DIR, "favicon.svg"))

    @app.get("/icons.svg")
    def icons():
        return FileResponse(os.path.join(STATIC_DIR, "icons.svg"))


@app.get("/api/health")
def health():
    return {"status": "ok", "device": str(device), "model": "ResNet-152", "classes": CLASSES}


@app.on_event("startup")
def seed_admin():
    from .database import SessionLocal
    from .models_db import User
    from .auth import hash_password
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(username="admin", password_hash=hash_password("admin123"), real_name="管理员", role="admin"))
        db.commit()
    db.close()


# Catch-all: serve index.html for SPA routing (must be last)
if os.path.isdir(STATIC_DIR):
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API/file routes
        if full_path.startswith(("api/", "files/")):
            return
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
