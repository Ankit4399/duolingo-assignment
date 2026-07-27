from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import DATABASE_URL
from app.models.base import Base

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db() -> None:
    import app.models
    Base.metadata.create_all(bind=engine)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()