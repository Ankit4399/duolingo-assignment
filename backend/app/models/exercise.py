from sqlalchemy import Column, Integer, String, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base
from app.models.enums import ExerciseType

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    order = Column(Integer, nullable=False)
    type = Column(Enum(ExerciseType), nullable=False)
    prompt = Column(String(500), nullable=False)
    content = Column(JSON, nullable=False, default=dict)
    correct_answer = Column(JSON, nullable=False)

    lesson = relationship("Lesson", back_populates="exercises")