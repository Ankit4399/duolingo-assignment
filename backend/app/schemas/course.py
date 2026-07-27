from typing import Any, Optional
from app.models.enums import ExerciseType, LessonType, SkillStatus
from app.schemas.base import ORMBase

class ExerciseOut(ORMBase):
    id: int
    order: int
    type: ExerciseType
    prompt: str
    content: dict[str, Any]


class LessonOut(ORMBase):
    id: int
    order: int
    type: LessonType
    xp_reward: int


class LessonDetailOut(LessonOut):
    exercises: list[ExerciseOut]


class SkillOut(ORMBase):
    id: int
    order: int
    title: str
    icon: str
    max_crowns: int
    status: SkillStatus = SkillStatus.LOCKED
    crown_level: int = 0


class UnitOut(ORMBase):
    id: int
    order: int
    title: str
    description: Optional[str] = None
    color_theme: str
    skills: list[SkillOut] = []


class CoursePathOut(ORMBase):
    id: int
    language: str
    title: str
    units: list[UnitOut] = []