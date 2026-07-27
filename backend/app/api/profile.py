from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.logic import compute_streak
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/users", tags=["users"])

def get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/profile", response_model=schemas.UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    today = date.today()
    activity_dates = [
        d.activity_date.date()
        for d in db.query(models.DailyActivity).filter_by(user_id=user_id, goal_met=True).all()
    ]
    current_streak = compute_streak(activity_dates, today)
    skills_completed = (
        db.query(models.UserSkillProgress)
        .filter_by(user_id=user_id, status=models.SkillStatus.COMPLETED)
        .count()
    )
    achievements = [
        schemas.AchievementOut.model_validate(ua.achievement)
        for ua in db.query(models.UserAchievement).filter_by(user_id=user_id).all()
    ]
    out = schemas.UserProfileOut.model_validate(user)
    out.current_streak = current_streak
    out.longest_streak = current_streak
    out.skills_completed = skills_completed
    out.achievements = achievements
    return out