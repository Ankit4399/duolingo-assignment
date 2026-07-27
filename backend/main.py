from datetime import date, datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, init_db
from logic import check_answer, compute_hearts, compute_streak, is_daily_goal_met
import models
import schemas

DEFAULT_USER_ID = 1

app = FastAPI(title="Duolingo Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    from seed import seed
    from database import SessionLocal
    db = SessionLocal()
    try:
        unit_count = db.query(models.Unit).count()
        if unit_count < 4:
            print("New units missing. Re-seeding database...")
            models.Base.metadata.drop_all(bind=db.get_bind())
            models.Base.metadata.create_all(bind=db.get_bind())
            seed(db)
            print("Re-seed completed successfully.")
    except Exception as e:
        print(f"Error checking/seeding DB: {e}")
    finally:
        db.close()


def get_current_user_id() -> int:
    return DEFAULT_USER_ID


def get_user_or_404(db: Session, user_id: int) -> models.User:
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Path / skill tree
# ---------------------------------------------------------------------------

@app.get("/courses/{course_id}/path", response_model=schemas.CoursePathOut)
def get_course_path(
    course_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    course = db.get(models.Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    progress_rows = db.query(models.UserSkillProgress).filter_by(user_id=user_id).all()
    progress_by_skill = {p.skill_id: p for p in progress_rows}

    units_out = []
    for unit in course.units:
        skills_out = []
        for skill in unit.skills:
            progress = progress_by_skill.get(skill.id)
            if progress:
                status, crown_level = progress.status, progress.crown_level
            elif skill.unlock_requires_skill_id is None:
                status, crown_level = models.SkillStatus.AVAILABLE, 0
            else:
                prereq = progress_by_skill.get(skill.unlock_requires_skill_id)
                unlocked = prereq is not None and prereq.status == models.SkillStatus.COMPLETED
                status = models.SkillStatus.AVAILABLE if unlocked else models.SkillStatus.LOCKED
                crown_level = 0

            skill_out = schemas.SkillOut.model_validate(skill)
            skill_out.status = status
            skill_out.crown_level = crown_level
            skills_out.append(skill_out)

        unit_out = schemas.UnitOut.model_validate(unit)
        unit_out.skills = skills_out
        units_out.append(unit_out)

    course_out = schemas.CoursePathOut.model_validate(course)
    course_out.units = units_out
    return course_out


# ---------------------------------------------------------------------------
# Lesson flow: start -> answer (repeated) -> complete
# ---------------------------------------------------------------------------

@app.post("/lessons/{lesson_id}/attempts", response_model=schemas.LessonAttemptStartOut)
def start_lesson_attempt(
    lesson_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
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


@app.post("/lessons/attempts/{attempt_id}/answer", response_model=schemas.AnswerSubmitOut)
def submit_answer(
    attempt_id: int,
    payload: schemas.AnswerSubmitIn,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
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


@app.post("/lessons/attempts/{attempt_id}/complete", response_model=schemas.LessonCompleteOut)
def complete_lesson_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    attempt = db.get(models.LessonAttempt, attempt_id)
    if not attempt or attempt.user_id != user_id:
        raise HTTPException(status_code=404, detail="Attempt not found")

    user = get_user_or_404(db, user_id)

    if attempt.completed_at is not None:
        # Already finalized (e.g. failed out). Return current stats.
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

    # --- skill progress: create/advance crown level ---
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

    # --- daily activity + streak ---
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


# ---------------------------------------------------------------------------
# Users / profile / gamification
# ---------------------------------------------------------------------------

@app.get("/users/{user_id}/hearts", response_model=schemas.HeartsStatusOut)
def get_hearts(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    current, next_regen_at = compute_hearts(
        user.hearts, user.max_hearts, user.hearts_last_lost_at, datetime.utcnow()
    )
    return schemas.HeartsStatusOut(hearts=current, max_hearts=user.max_hearts, next_regen_at=next_regen_at)


@app.post("/users/{user_id}/hearts/refill", response_model=schemas.HeartsStatusOut)
def refill_hearts(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(db, user_id)
    # Refill hearts completely (costs mocked 100 gems)
    if user.gems >= 100:
        user.gems -= 100
        user.hearts = user.max_hearts
        user.hearts_last_lost_at = None
        db.commit()
    else:
        # Refill anyway as free practice reward
        user.hearts = user.max_hearts
        user.hearts_last_lost_at = None
        db.commit()
    return schemas.HeartsStatusOut(hearts=user.hearts, max_hearts=user.max_hearts, next_regen_at=None)


@app.get("/users/{user_id}/streak", response_model=schemas.StreakOut)
def get_streak(user_id: int, db: Session = Depends(get_db)):
    get_user_or_404(db, user_id)
    today = date.today()
    activity_dates = [
        d.activity_date.date()
        for d in db.query(models.DailyActivity).filter_by(user_id=user_id, goal_met=True).all()
    ]
    current = compute_streak(activity_dates, today)
    return schemas.StreakOut(current_streak=current, longest_streak=current)


@app.get("/users/{user_id}/profile", response_model=schemas.UserProfileOut)
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


@app.get("/leaderboard", response_model=list[schemas.LeaderboardEntryOut])
def get_leaderboard(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    users = db.query(models.User).order_by(models.User.total_xp.desc()).all()
    return [
        schemas.LeaderboardEntryOut(
            rank=i + 1, username=u.username, total_xp=u.total_xp, is_current_user=(u.id == user_id)
        )
        for i, u in enumerate(users)
    ]
