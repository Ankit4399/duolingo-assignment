from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.models.base import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    language = Column(String(50), nullable=False)       # e.g. "Spanish"
    title = Column(String(100), nullable=False)
    description = Column(String(500))

    units = relationship("Unit", back_populates="course", order_by="Unit.order")
