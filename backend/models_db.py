from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, DECIMAL, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(100), default="")
    role = Column(Enum("admin", "user"), default="user", nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    last_login = Column(DateTime, default=None)
    is_active = Column(SmallInteger, default=1)

    diagnoses = relationship("Diagnosis", back_populates="user", foreign_keys="Diagnosis.user_id")


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(String(20), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_name = Column(String(100), default="")
    patient_age = Column(Integer, default=None)
    patient_gender = Column(Enum("male", "female", "other"), default=None)
    eye_side = Column(Enum("left", "right", "unknown"), default="unknown")

    original_image = Column(String(500), nullable=False)
    heatmap_image = Column(String(500), nullable=False)

    pred_class = Column(SmallInteger, nullable=False)
    pred_label = Column(String(30), nullable=False)
    confidence = Column(DECIMAL(5, 2), nullable=False)
    prob_no_dr = Column(DECIMAL(5, 2), nullable=False)
    prob_mild = Column(DECIMAL(5, 2), nullable=False)
    prob_moderate = Column(DECIMAL(5, 2), nullable=False)
    prob_severe = Column(DECIMAL(5, 2), nullable=False)
    prob_proliferative = Column(DECIMAL(5, 2), nullable=False)

    risk_level = Column(String(20), nullable=False)
    recommendation = Column(Text)

    review_status = Column(Enum("pending", "confirmed", "rejected"), default="pending")
    reviewer_id = Column(Integer, ForeignKey("users.id"), default=None)
    review_comment = Column(Text, default=None)
    reviewed_at = Column(DateTime, default=None)

    created_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="diagnoses", foreign_keys=[user_id])
    report = relationship("Report", back_populates="diagnosis", uselist=False)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    diagnosis_id = Column(Integer, ForeignKey("diagnoses.id", ondelete="CASCADE"), unique=True, nullable=False)
    file_path = Column(String(500), nullable=False)
    generated_at = Column(DateTime, default=datetime.now)

    diagnosis = relationship("Diagnosis", back_populates="report")
