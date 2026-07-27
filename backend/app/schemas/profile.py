from typing import Optional
from pydantic import BaseModel
from app.schemas.base import ORMBase

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
