from __future__ import annotations
import enum
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime, Text, Date, UniqueConstraint, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON
from app.models.base import Base


class StageEnum(str, enum.Enum):
    Interested = "Interested"
    Applied = "Applied"
    OA = "OA"
    Interview = "Interview"
    Offer = "Offer"
    Rejected = "Rejected"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Profile(Base):
    __tablename__ = "profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    skills_json: Mapped[list] = mapped_column(JSON, default=list)
    interests_text: Mapped[str] = mapped_column(Text, default="")
    locations_json: Mapped[list] = mapped_column(JSON, default=list)
    grad_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)


class Opportunity(Base):
    __tablename__ = "opportunities"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    org: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255))
    tags_json: Mapped[list] = mapped_column(JSON, default=list)
    deadline_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    embedding_vector: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"
    __table_args__ = (UniqueConstraint("user_id", "opportunity_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    opportunity_id: Mapped[Optional[int]] = mapped_column(ForeignKey("opportunities.id"), nullable=True)
    title_snapshot: Mapped[str] = mapped_column(String(255))
    org_snapshot: Mapped[str] = mapped_column(String(255))
    url_snapshot: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    stage: Mapped[StageEnum] = mapped_column(Enum(StageEnum), default=StageEnum.Interested)
    notes: Mapped[str] = mapped_column(Text, default="")
    deadline_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_applied: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), index=True)
    payload_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RelevanceRating(Base):
    __tablename__ = "relevance_ratings"
    __table_args__ = (UniqueConstraint("user_id", "opportunity_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id"))
    rating: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Resume(Base):
    __tablename__ = "resumes"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    resume_text: Mapped[str] = mapped_column(Text)
    filename: Mapped[str] = mapped_column(String(255))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
