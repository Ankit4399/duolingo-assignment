from datetime import date, datetime
from typing import Any, Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict

from models import ExerciseType, LessonType, SkillStatus


# ---------------------------------------------------------------------------
# Shared config
# ---------------------------------------------------------------------------

class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# User / profile
# ---------------------------------------------------------------------------

class UserOut(ORMBase):
    id: int
    username: str
    total_xp: int
    gems: int
    hearts: int
    max_hearts: int
    daily_xp_goal: int
    current_streak: int = 0


class UserProfileOut(UserOut):
    longest_streak: int = 0
    skills_completed: int = 0
    achievements: list["AchievementOut"] = []


class HeartsStatusOut(BaseModel):
    hearts: int
    max_hearts: int
    next_regen_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Course content
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Lesson attempt flow
# ---------------------------------------------------------------------------

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
    achievements_unlocked: list["AchievementOut"] = []


# ---------------------------------------------------------------------------
# Gamification
# ---------------------------------------------------------------------------

class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: Optional[date] = None
    freeze_available: bool = False


class LeaderboardEntryOut(BaseModel):
    rank: int
    username: str
    total_xp: int
    is_current_user: bool = False


class AchievementOut(ORMBase):
    id: int
    name: str
    description: Optional[str] = None
    icon: str


class DailyGoalOut(BaseModel):
    goal_xp: int
    earned_xp_today: int
    goal_met: bool


UserProfileOut.model_rebuild()
LessonCompleteOut.model_rebuild()
