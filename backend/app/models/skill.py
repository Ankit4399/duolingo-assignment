from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String(100), nullable=False)
    icon = Column(String(50), default="book")
    unlock_requires_skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    max_crowns = Column(Integer, default=5)

    unit = relationship("Unit", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill", order_by="Lesson.order")