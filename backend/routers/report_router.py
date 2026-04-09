from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models_db import User, Diagnosis, Report
from ..auth import get_current_user
from ..word_export import generate_report
from .diagnosis_router import _check_access

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _get_or_create_report(d: Diagnosis, db) -> Report:
    """Generate report if not already cached."""
    if d.report:
        return d.report
    path = generate_report(d)
    report = Report(diagnosis_id=d.id, file_path=path)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{uid}/download")
def download_report(uid: str, user: User = Depends(get_current_user), db=Depends(get_db)):
    """Single endpoint: auto-generates if needed, then downloads."""
    d = db.query(Diagnosis).filter(Diagnosis.uid == uid).first()
    if not d:
        raise HTTPException(404, "Diagnosis not found")
    _check_access(d, user)
    report = _get_or_create_report(d, db)
    return FileResponse(
        report.file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"DR_Report_{uid}.docx",
    )
