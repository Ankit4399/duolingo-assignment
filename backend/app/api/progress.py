from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.config import DEFAULT_USER_ID
from app.core.logic import compute_hearts, compute_streak
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/users", tags=["users"])

def get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/hearts", response_model=schemas.HeartsStatusOut)
def get_hearts(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    current, next_regen_at = compute_hearts(
        user.hearts, user.max_hearts, user.hearts_last_lost_at, datetime.utcnow()
    )
    return schemas.HeartsStatusOut(hearts=current, max_hearts=user.max_hearts, next_regen_at=next_regen_at)


@router.post("/{user_id}/hearts/refill", response_model=schemas.HeartsStatusOut)
def refill_hearts(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    if user.gems >= 100:
        user.gems -= 100
        user.hearts = user.max_hearts
        user.hearts_last_lost_at = None
        db.commit()
    else:
        user.hearts = user.max_hearts
        user.hearts_last_lost_at = None
        db.commit()
    return schemas.HeartsStatusOut(hearts=user.hearts, max_hearts=user.max_hearts, next_regen_at=None)


@router.get("/{user_id}/streak", response_model=schemas.StreakOut)
def get_streak(user_id: int, db: Session = Depends(get_db)):
    get_user_or_404(db, user_id)
    today = date.today()
    activity_dates = [
        d.activity_date.date()
        for d in db.query(models.DailyActivity).filter_by(user_id=user_id, goal_met=True).all()
    ]
    current = compute_streak(activity_dates, today)
    return schemas.StreakOut(current_streak=current, longest_streak=current)
