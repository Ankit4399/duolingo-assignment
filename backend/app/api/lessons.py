from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.config import DEFAULT_USER_ID
from app.core.logic import check_answer, compute_hearts, compute_streak, is_daily_goal_met
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/lessons", tags=["lessons"])

def get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{lesson_id}/attempts", response_model=schemas.LessonAttemptStartOut)
def start_lesson_attempt(
    lesson_id: int,
    db: Session = Depends(get_db),
):
    user_id = DEFAULT_USER_ID
    lesson = db.get(models.Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    user = get_user_or_404(db, user_id)

    current_hearts, _ = compute_hearts(
        user.hearts, user.max_hearts, user.hearts_last_lost_at, datetime.utcnow()
    )
    if current_hearts != user.hearts:
        user.hearts = current_hearts
        if current_hearts >= user.max_hearts:
            user.hearts_last_lost_at = None
        db.commit()

    if current_hearts <= 0:
        raise HTTPException(status_code=400, detail="Out of hearts")

    attempt = models.LessonAttempt(user_id=user_id, lesson_id=lesson_id)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return schemas.LessonAttemptStartOut(
        attempt_id=attempt.id,
        lesson=schemas.LessonDetailOut.model_validate(lesson),
        hearts=current_hearts,
    )


@router.post("/attempts/{attempt_id}/answer", response_model=schemas.AnswerSubmitOut)
def submit_answer(
    attempt_id: int,
    payload: schemas.AnswerSubmitIn,
    db: Session = Depends(get_db),
):
    user_id = DEFAULT_USER_ID
    attempt = db.get(models.LessonAttempt, attempt_id)
    if not attempt or attempt.user_id != user_id:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.completed_at is not None:
        raise HTTPException(status_code=400, detail="Attempt already finished")

    exercise = db.get(models.Exercise, payload.exercise_id)
    if not exercise or exercise.lesson_id != attempt.lesson_id:
        raise HTTPException(status_code=400, detail="Exercise does not belong to this lesson")

    is_correct = check_answer(exercise.type.value, payload.user_answer, exercise.correct_answer)

    db.add(models.ExerciseAttempt(
        lesson_attempt_id=attempt.id,
        exercise_id=exercise.id,
        user_answer=payload.user_answer,
        is_correct=is_correct,
    ))

    user = get_user_or_404(db, user_id)
    lesson_failed = False
    if not is_correct:
        attempt.hearts_lost += 1
        user.hearts = max(0, user.hearts - 1)
        user.hearts_last_lost_at = datetime.utcnow()
        if user.hearts <= 0:
            lesson_failed = True
            attempt.completed_at = datetime.utcnow()
            attempt.passed = False

    db.commit()

    return schemas.AnswerSubmitOut(
        is_correct=is_correct,
        correct_answer=exercise.correct_answer,
        hearts_remaining=user.hearts,
        lesson_failed=lesson_failed,
    )


@router.post("/attempts/{attempt_id}/complete", response_model=schemas.LessonCompleteOut)
def complete_lesson_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
):
    user_id = DEFAULT_USER_ID
    attempt = db.get(models.LessonAttempt, attempt_id)
    if not attempt or attempt.user_id != user_id:
        raise HTTPException(status_code=404, detail="Attempt not found")

    user = get_user_or_404(db, user_id)

    if attempt.completed_at is not None:
        today = date.today()
        activity_dates = [
            d.activity_date.date()
            for d in db.query(models.DailyActivity).filter_by(user_id=user_id, goal_met=True).all()
        ]
        current_streak = compute_streak(activity_dates, today)
        return schemas.LessonCompleteOut(
            passed=attempt.passed, xp_earned=attempt.xp_earned,
            total_xp=user.total_xp,
            crown_level=0, new_streak=current_streak, daily_goal_met=False,
        )

    lesson = db.get(models.Lesson, attempt.lesson_id)

    attempt.completed_at = datetime.utcnow()
    attempt.passed = True
    attempt.xp_earned = lesson.xp_reward
    user.total_xp += lesson.xp_reward

    progress = (
        db.query(models.UserSkillProgress)
        .filter_by(user_id=user_id, skill_id=lesson.skill_id)
        .first()
    )
    if not progress:
        progress = models.UserSkillProgress(user_id=user_id, skill_id=lesson.skill_id)
        db.add(progress)

    is_first_completion = progress.status != models.SkillStatus.COMPLETED
    progress.status = models.SkillStatus.COMPLETED
    progress.xp_earned += lesson.xp_reward
    progress.last_practiced_at = datetime.utcnow()
    if is_first_completion:
        progress.crown_level = max(1, progress.crown_level)
    else:
        skill = db.get(models.Skill, lesson.skill_id)
        progress.crown_level = min(skill.max_crowns, progress.crown_level + 1)

    today = date.today()
    daily = (
        db.query(models.DailyActivity)
        .filter_by(user_id=user_id, activity_date=datetime.combine(today, datetime.min.time()))
        .first()
    )
    if not daily:
        daily = models.DailyActivity(
            user_id=user_id, activity_date=datetime.combine(today, datetime.min.time()), xp_earned=0
        )
        db.add(daily)
    daily.xp_earned += lesson.xp_reward
    daily.goal_met = is_daily_goal_met(daily.xp_earned, user.daily_xp_goal)

    db.flush()

    activity_dates = [
        d.activity_date.date()
        for d in db.query(models.DailyActivity).filter_by(user_id=user_id, goal_met=True).all()
    ]
    new_streak = compute_streak(activity_dates, today)

    db.commit()

    return schemas.LessonCompleteOut(
        passed=True,
        xp_earned=lesson.xp_reward,
        total_xp=user.total_xp,
        crown_level=progress.crown_level,
        new_streak=new_streak,
        daily_goal_met=daily.goal_met,
    )
