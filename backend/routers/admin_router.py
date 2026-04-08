from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models_db import User, Diagnosis
from ..auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/statistics")
def get_statistics(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Single query for total + severity distribution
    dist_rows = db.query(Diagnosis.pred_class, func.count()).group_by(Diagnosis.pred_class).all()
    dist_map = dict(dist_rows)
    distribution = [dist_map.get(i, 0) for i in range(5)]
    total = sum(distribution)
    high_risk = distribution[3] + distribution[4]

    avg_conf = db.query(func.avg(Diagnosis.confidence)).scalar() or 0
    pending = db.query(func.count(Diagnosis.id)).filter(Diagnosis.review_status == "pending").scalar()

    # Daily counts for last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    date_expr = func.strftime('%Y-%m-%d', Diagnosis.created_at)
    daily_rows = (
        db.query(date_expr, func.count())
        .filter(Diagnosis.created_at >= thirty_days_ago)
        .group_by(date_expr)
        .order_by(date_expr)
        .all()
    )
    daily_counts = [{"date": str(row[0]), "count": row[1]} for row in daily_rows]

    return {
        "total_diagnoses": total,
        "severity_distribution": distribution,
        "avg_confidence": round(float(avg_conf), 2),
        "high_risk_count": high_risk,
        "pending_review_count": pending,
        "daily_counts": daily_counts,
    }


@router.get("/diagnoses")
def search_diagnoses(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    severity: int = Query(None),
    keyword: str = Query(None),
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Diagnosis)
    if severity is not None:
        query = query.filter(Diagnosis.pred_class == severity)
    if keyword:
        query = query.filter(Diagnosis.patient_name.contains(keyword))
    total = query.count()
    items = query.order_by(Diagnosis.created_at.desc()).offset((page - 1) * size).limit(size).all()
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "uid": d.uid,
                "user_id": d.user_id,
                "patient_name": d.patient_name,
                "pred_class": d.pred_class,
                "pred_label": d.pred_label,
                "confidence": float(d.confidence),
                "risk_level": d.risk_level,
                "review_status": d.review_status,
                "created_at": d.created_at.isoformat(),
            }
            for d in items
        ],
    }


@router.put("/diagnoses/{uid}/review")
def review_diagnosis(uid: str, status: str, comment: str = "", user: User = Depends(require_admin), db: Session = Depends(get_db)):
    d = db.query(Diagnosis).filter(Diagnosis.uid == uid).first()
    if not d:
        raise HTTPException(404, "Not found")
    if status not in ("confirmed", "rejected"):
        raise HTTPException(400, "status must be confirmed or rejected")
    d.review_status = status
    d.review_comment = comment
    d.reviewer_id = user.id
    d.reviewed_at = datetime.now()
    db.commit()
    return {"ok": True}


@router.get("/users")
def list_users(user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {"id": u.id, "username": u.username, "real_name": u.real_name, "role": u.role,
         "is_active": u.is_active, "created_at": u.created_at.isoformat()}
        for u in users
    ]
