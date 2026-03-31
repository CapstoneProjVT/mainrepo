from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.models import StageEnum


class AuthIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class ProfileIn(BaseModel):
    skills: list[str] = []
    interests: str = ""
    locations: list[str] = []
    grad_year: Optional[int] = None


class ProfileOut(ProfileIn):
    pass


class OpportunityOut(BaseModel):
    id: int
    title: str
    org: str
    description: str
    location: str
    tags: list[str]
    deadline_date: Optional[date]
    url: Optional[str]
    match_score: float
    explanation: dict
    is_saved: bool = False


class AppIn(BaseModel):
    opportunity_id: Optional[int] = None
    title_snapshot: Optional[str] = None
    org_snapshot: Optional[str] = None
    url_snapshot: Optional[str] = None
    stage: StageEnum = StageEnum.Interested
    notes: str = ""
    deadline: Optional[date] = None
    date_applied: Optional[date] = None


class AppPatch(BaseModel):
    title_snapshot: Optional[str] = None
    org_snapshot: Optional[str] = None
    notes: Optional[str] = None
    deadline: Optional[date] = None
    date_applied: Optional[date] = None


class StagePatch(BaseModel):
    stage: StageEnum


class RatingIn(BaseModel):
    rating: int = Field(ge=1, le=5)


class EventOut(BaseModel):
    id: int
    event_type: str
    created_at: datetime
