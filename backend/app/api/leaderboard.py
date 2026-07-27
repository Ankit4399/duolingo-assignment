from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.config import DEFAULT_USER_ID
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=list[schemas.LeaderboardEntryOut])
def get_leaderboard(db: Session = Depends(get_db)):
    user_id = DEFAULT_USER_ID
    users = db.query(models.User).order_by(models.User.total_xp.desc()).all()
    return [
        schemas.LeaderboardEntryOut(
            rank=i + 1, username=u.username, total_xp=u.total_xp, is_current_user=(u.id == user_id)
        )
        for i, u in enumerate(users)
    ]