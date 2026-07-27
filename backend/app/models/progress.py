from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, Enum, DateTime, UniqueConstraint, Boolean, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import SkillStatus

class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    status = Column(Enum(SkillStatus), default=SkillStatus.LOCKED)
    crown_level = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)
    last_practiced_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="skill_progress")
    skill = relationship("Skill")


class LessonAttempt(Base):
    __tablename__ = "lesson_attempts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    hearts_lost = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)
    passed = Column(Boolean, default=False)

    user = relationship("User", back_populates="lesson_attempts")
    lesson = relationship("Lesson")
    exercise_attempts = relationship("ExerciseAttempt", back_populates="lesson_attempt")


class ExerciseAttempt(Base):
    __tablename__ = "exercise_attempts"

    id = Column(Integer, primary_key=True)
    lesson_attempt_id = Column(Integer, ForeignKey("lesson_attempts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    user_answer = Column(JSON, nullable=True)
    is_correct = Column(Boolean, nullable=False)
    answered_at = Column(DateTime, default=datetime.utcnow)

    lesson_attempt = relationship("LessonAttempt", back_populates="exercise_attempts")
    exercise = relationship("Exercise")


class DailyActivity(Base):
    __tablename__ = "daily_activity"
    __table_args__ = (UniqueConstraint("user_id", "activity_date", name="uq_user_day"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_date = Column(DateTime, nullable=False)
    xp_earned = Column(Integer, default=0)
    goal_met = Column(Boolean, default=False)

    user = relationship("User", back_populates="daily_activity")
