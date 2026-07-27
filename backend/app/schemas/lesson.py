from typing import Any
from pydantic import BaseModel
from app.schemas.course import LessonDetailOut
from app.schemas.profile import AchievementOut

class LessonAttemptStartOut(BaseModel):
    attempt_id: int
    lesson: LessonDetailOut
    hearts: int


class AnswerSubmitIn(BaseModel):
    exercise_id: int
    user_answer: Any


class AnswerSubmitOut(BaseModel):
    is_correct: bool
    correct_answer: Any
    hearts_remaining: int
    lesson_failed: bool = False


class LessonCompleteOut(BaseModel):
    passed: bool
    xp_earned: int
    total_xp: int
    crown_level: int
    new_streak: int
    daily_goal_met: bool
    achievements_unlocked: list[AchievementOut] = []
