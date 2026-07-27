from sqlalchemy import Column, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import LessonType

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    order = Column(Integer, nullable=False)
    type = Column(Enum(LessonType), default=LessonType.NORMAL)
    xp_reward = Column(Integer, default=10)

    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson", order_by="Exercise.order")