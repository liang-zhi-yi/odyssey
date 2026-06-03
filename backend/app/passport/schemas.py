"""Passport (capability passport) aggregated response schema.

Passport is NOT a database table — it is dynamically generated from:
  - UserSkill
  - UserCredential
  - Project
"""

from pydantic import BaseModel


class PassportSkillEntry(BaseModel):
    name: str
    rank: str
    score: int


class PassportCredentialEntry(BaseModel):
    name: str


class PassportProjectEntry(BaseModel):
    title: str


class PassportResponse(BaseModel):
    user: str
    skills: list[PassportSkillEntry] = []
    credentials: list[PassportCredentialEntry] = []
    projects: list[PassportProjectEntry] = []
