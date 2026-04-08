import os
import uuid
import base64
from io import BytesIO

import numpy as np
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session
from PIL import Image

from ..database import get_db
from ..models_db import User, Diagnosis
from ..auth import get_current_user
from ..config import UPLOAD_DIR, HEATMAP_DIR
from ..constants import CLASSES, SEVERITY_INFO

router = APIRouter(prefix="/api/diagnoses", tags=["diagnosis"])


def _get_inference():
    from backend.app import model, grad_cam, inference_transform, apply_heatmap
    return model, grad_cam, inference_transform, apply_heatmap


def _check_access(d: Diagnosis, user: User):
    if d.user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Access denied")


@router.post("/")
async def create_diagnosis(
    file: UploadFile = File(...),
    patient_name: str = Form(""),
    patient_age: int = Form(None),
    patient_gender: str = Form(None),
    eye_side: str = Form("unknown"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(400, "Only PNG/JPG/JPEG allowed")

    model, grad_cam, inference_transform, apply_heatmap = _get_inference()
    device = next(model.parameters()).device

    contents = await file.read()
    img = Image.open(BytesIO(contents)).convert("RGB")

    uid = uuid.uuid4().hex[:12]
    img_path = os.path.join(UPLOAD_DIR, f"{uid}.png")
    img.save(img_path)

    tensor = inference_transform(img).unsqueeze(0).to(device)
    cam, pred_class, confidence, probs = grad_cam.generate(tensor)

    img_np = np.array(img.resize((224, 224))) / 255.0
    overlay_np = apply_heatmap(img_np, cam)
    heatmap_path = os.path.join(HEATMAP_DIR, f"{uid}_gradcam.png")
    overlay_img = Image.fromarray(overlay_np)
    overlay_img.save(heatmap_path)

    probs_pct = [round(float(p) * 100, 2) for p in probs]
    info = SEVERITY_INFO[pred_class]
    diagnosis = Diagnosis(
        uid=uid, user_id=user.id,
        patient_name=patient_name, patient_age=patient_age,
        patient_gender=patient_gender, eye_side=eye_side,
        original_image=img_path, heatmap_image=heatmap_path,
        pred_class=pred_class, pred_label=CLASSES[pred_class],
        confidence=round(float(confidence) * 100, 2),
        prob_no_dr=probs_pct[0], prob_mild=probs_pct[1],
        prob_moderate=probs_pct[2], prob_severe=probs_pct[3],
        prob_proliferative=probs_pct[4],
        risk_level=info["risk"],
        recommendation=info["recommendation"],
    )
    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)

    buf_orig = BytesIO()
    img.save(buf_orig, format="PNG")
    buf_heat = BytesIO()
    overlay_img.save(buf_heat, format="PNG")

    return {
        "uid": uid,
        "timestamp": diagnosis.created_at.isoformat(),
        "prediction": {
            "class": pred_class,
            "label": CLASSES[pred_class],
            "confidence": diagnosis.confidence,
            "probabilities": {CLASSES[i]: probs_pct[i] for i in range(5)},
        },
        "severity": info,
        "image": f"data:image/png;base64,{base64.b64encode(buf_orig.getvalue()).decode()}",
        "heatmap": f"data:image/png;base64,{base64.b64encode(buf_heat.getvalue()).decode()}",
    }


@router.get("/")
def list_diagnoses(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Diagnosis).filter(Diagnosis.user_id == user.id)
    total = query.count()
    items = query.order_by(Diagnosis.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {"total": total, "page": page, "size": size, "items": [_diagnosis_to_dict(d) for d in items]}


@router.get("/{uid}")
def get_diagnosis(uid: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Diagnosis).filter(Diagnosis.uid == uid).first()
    if not d:
        raise HTTPException(404, "Diagnosis not found")
    _check_access(d, user)
    result = _diagnosis_to_dict(d)
    result["image"] = _file_to_base64(d.original_image)
    result["heatmap"] = _file_to_base64(d.heatmap_image)
    return result


@router.delete("/{uid}")
def delete_diagnosis(uid: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Diagnosis).filter(Diagnosis.uid == uid, Diagnosis.user_id == user.id).first()
    if not d:
        raise HTTPException(404, "Not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


def _diagnosis_to_dict(d: Diagnosis) -> dict:
    return {
        "uid": d.uid,
        "patient_name": d.patient_name,
        "patient_age": d.patient_age,
        "patient_gender": d.patient_gender,
        "eye_side": d.eye_side,
        "pred_class": d.pred_class,
        "pred_label": d.pred_label,
        "confidence": float(d.confidence),
        "prob_no_dr": float(d.prob_no_dr),
        "prob_mild": float(d.prob_mild),
        "prob_moderate": float(d.prob_moderate),
        "prob_severe": float(d.prob_severe),
        "prob_proliferative": float(d.prob_proliferative),
        "risk_level": d.risk_level,
        "recommendation": d.recommendation,
        "review_status": d.review_status,
        "created_at": d.created_at.isoformat(),
    }


def _file_to_base64(path: str) -> str:
    try:
        with open(path, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"
    except (FileNotFoundError, OSError):
        return ""
