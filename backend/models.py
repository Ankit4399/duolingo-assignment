from datetime import datetime
from enum import Enum as PyEnum

# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ExerciseType(str, PyEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE = "translate"          # word bank / tap-the-words
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"
    SPEAK = "speak"


class SkillStatus(str, PyEnum):
    LOCKED = "locked"
    AVAILABLE = "available"
    COMPLETED = "completed"


class LessonType(str, PyEnum):
    NORMAL = "normal"
    PRACTICE = "practice"
    LEGENDARY = "legendary"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Gamification state (fast-read fields, not event log)
    total_xp = Column(Integer, default=0)
    gems = Column(Integer, default=500)  # mocked currency
    hearts = Column(Integer, default=5)
    max_hearts = Column(Integer, default=5)
    hearts_last_lost_at = Column(DateTime, nullable=True)
    daily_xp_goal = Column(Integer, default=30)

    skill_progress = relationship("UserSkillProgress", back_populates="user")
    lesson_attempts = relationship("LessonAttempt", back_populates="user")
    daily_activity = relationship("DailyActivity", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")


# ---------------------------------------------------------------------------
# Course content: Course -> Unit -> Skill -> Lesson -> Exercise
# ---------------------------------------------------------------------------

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    language = Column(String(50), nullable=False)       # e.g. "Spanish"
    title = Column(String(100), nullable=False)
    description = Column(String(500))

    units = relationship("Unit", back_populates="course", order_by="Unit.order")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(500))
    color_theme = Column(String(20), default="#58cc02")  # duolingo-style unit color

    course = relationship("Course", back_populates="units")
    skills = relationship("Skill", back_populates="unit", order_by="Skill.order")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String(100), nullable=False)
    icon = Column(String(50), default="book")
    # what must be completed before this unlocks (self-referential, nullable)
    unlock_requires_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    max_crowns = Column(Integer, default=5)

    unit = relationship("Unit", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill", order_by="Lesson.order")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    order = Column(Integer, nullable=False)
    type = Column(Enum(LessonType), default=LessonType.NORMAL)
    xp_reward = Column(Integer, default=10)

    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson", order_by="Exercise.order")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    order = Column(Integer, nullable=False)
    type = Column(Enum(ExerciseType), nullable=False)
    prompt = Column(String(500), nullable=False)

    # Shape depends on `type`, e.g.:
    #  multiple_choice: {"options": ["...", "..."], "media": null}
    #  translate:       {"word_bank": ["...", "..."]}
    #  match_pairs:      {"pairs": [["dog","perro"], ["cat","gato"]]}
    #  fill_blank:       {"sentence": "El ___ es rojo", "options": ["gato","perro"]}
    #  type_answer:      {}
    content = Column(JSON, nullable=False, default=dict)

    # Shape depends on `type` too, e.g. single string, list of strings,
    # or list of pairs -- kept generic on purpose.
    correct_answer = Column(JSON, nullable=False)

    lesson = relationship("Lesson", back_populates="exercises")


# ---------------------------------------------------------------------------
# Per-user progress (current-state, fast reads for the path screen)
# ---------------------------------------------------------------------------

class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    status = Column(Enum(SkillStatus), default=SkillStatus.LOCKED)
    crown_level = Column(Integer, default=0)  # increments each full re-clear
    xp_earned = Column(Integer, default=0)
    last_practiced_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="skill_progress")
    skill = relationship("Skill")


# ---------------------------------------------------------------------------
# Event log (attempts) -- used for XP/streak calc, mistake review, analytics
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Streak / daily activity
# ---------------------------------------------------------------------------

class DailyActivity(Base):
    __tablename__ = "daily_activity"
    __table_args__ = (UniqueConstraint("user_id", "activity_date", name="uq_user_day"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_date = Column(DateTime, nullable=False)  # store as date-only
    xp_earned = Column(Integer, default=0)
    goal_met = Column(Boolean, default=False)

    user = relationship("User", back_populates="daily_activity")


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    icon = Column(String(50), default="trophy")
    criteria_type = Column(String(50))   # e.g. "streak", "total_xp", "skills_completed"
    criteria_value = Column(Integer)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")
