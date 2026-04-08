from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    username: str
    password: str
    real_name: str = ""


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    real_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DiagnosisOut(BaseModel):
    uid: str
    patient_name: str
    patient_age: Optional[int]
    patient_gender: Optional[str]
    eye_side: str
    pred_class: int
    pred_label: str
    confidence: float
    prob_no_dr: float
    prob_mild: float
    prob_moderate: float
    prob_severe: float
    prob_proliferative: float
    risk_level: str
    recommendation: Optional[str]
    review_status: str
    created_at: datetime
    original_image: str
    heatmap_image: str

    class Config:
        from_attributes = True


class ReviewRequest(BaseModel):
    status: str  # confirmed / rejected
    comment: str = ""


class StatsOut(BaseModel):
    total_diagnoses: int
    severity_distribution: list[int]
    avg_confidence: float
    high_risk_count: int
    pending_review_count: int
    daily_counts: list[dict]
