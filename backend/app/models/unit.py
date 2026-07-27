from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(500))
    color_theme = Column(String(20), default="#58cc02")  

    course = relationship("Course", back_populates="units")
    skills = relationship("Skill", back_populates="unit", order_by="Skill.order")