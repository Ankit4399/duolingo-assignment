from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class HeartsStatusOut(BaseModel):
    hearts: int
    max_hearts: int
    next_regen_at: Optional[datetime] = None


class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    last_active_date: Optional[date] = None
    freeze_available: bool = False


class DailyGoalOut(BaseModel):
    goal_xp: int
    earned_xp_today: int
    goal_met: bool