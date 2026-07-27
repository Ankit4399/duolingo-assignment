from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import SessionLocal, init_db
from app.database.seed import seed
from app.api.courses import router as courses_router
from app.api.lessons import router as lessons_router
from app.api.progress import router as progress_router
from app.api.profile import router as profile_router
from app.api.leaderboard import router as leaderboard_router
import app.models as models

app = FastAPI(title="Duolingo Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses_router)
app.include_router(lessons_router)
app.include_router(progress_router)
app.include_router(profile_router)
app.include_router(leaderboard_router)

@app.on_event("startup")
def on_startup() -> None:
    init_db()
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
