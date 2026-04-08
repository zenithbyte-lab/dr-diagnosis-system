from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models_db import User, Diagnosis, Report
from ..auth import get_current_user
from ..word_export import generate_report
from .diagnosis_router import _check_access

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _get_diagnosis(uid: str, user: User, db) -> Diagnosis:
    d = db.query(Diagnosis).filter(Diagnosis.uid == uid).first()
    if not d:
        raise HTTPException(404, "Diagnosis not found")
    _check_access(d, user)
    return d


@router.post("/{uid}")
def create_report(uid: str, user: User = Depends(get_current_user), db=Depends(get_db)):
    d = _get_diagnosis(uid, user, db)
    if d.report:
        return {"file_path": d.report.file_path, "uid": uid}
    path = generate_report(d)
    db.add(Report(diagnosis_id=d.id, file_path=path))
    db.commit()
    return {"file_path": path, "uid": uid}


@router.get("/{uid}/download")
def download_report(uid: str, user: User = Depends(get_current_user), db=Depends(get_db)):
    d = _get_diagnosis(uid, user, db)
    if not d.report:
        raise HTTPException(404, "Report not generated yet. POST first.")
    return FileResponse(
        d.report.file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"DR_Report_{uid}.docx",
    )
