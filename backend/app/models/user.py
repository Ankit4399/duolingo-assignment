from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    total_xp = Column(Integer, default=0)
    gems = Column(Integer, default=500)  
    hearts = Column(Integer, default=5)
    max_hearts = Column(Integer, default=5)
    hearts_last_lost_at = Column(DateTime, nullable=True)
    daily_xp_goal = Column(Integer, default=30)

    skill_progress = relationship("UserSkillProgress", back_populates="user")
    lesson_attempts = relationship("LessonAttempt", back_populates="user")
    daily_activity = relationship("DailyActivity", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")