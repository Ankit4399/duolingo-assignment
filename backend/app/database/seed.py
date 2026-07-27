from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import DATABASE_URL
from app.models.base import Base
from app.models.enums import ExerciseType, SkillStatus, LessonType
from app.models.achievement import Achievement, UserAchievement
from app.models.course import Course
from app.models.unit import Unit
from app.models.skill import Skill
from app.models.lesson import Lesson
from app.models.exercise import Exercise
from app.models.user import User
from app.models.progress import UserSkillProgress, LessonAttempt, ExerciseAttempt, DailyActivity

def seed(session: Session) -> None:
    course = Course(language="Spanish", title="Spanish for Beginners",
                     description="Learn Spanish from scratch.")
    session.add(course)
    session.flush()

    unit1 = Unit(course_id=course.id, order=1, title="Basics",
                 description="Greetings and everyday words", color_theme="#58cc02")
    unit2 = Unit(course_id=course.id, order=2, title="Phrases",
                 description="Simple sentences", color_theme="#1cb0f6")
    unit3 = Unit(course_id=course.id, order=3, title="Places",
                 description="Travel and directions", color_theme="#ff9600")
    unit4 = Unit(course_id=course.id, order=4, title="Interactions",
                 description="Daily conversation and shopping", color_theme="#8b6bf2")
    session.add_all([unit1, unit2, unit3, unit4])
    session.flush()

    skills_data = [
        (unit1.id, 1, "Greetings", "hand"),
        (unit1.id, 2, "Animals", "paw"),
        (unit1.id, 3, "Food", "food"),
        (unit2.id, 1, "Family", "users"),
        (unit2.id, 2, "Colors", "palette"),
        (unit3.id, 1, "Travel", "hand"),
        (unit3.id, 2, "Directions", "palette"),
        (unit4.id, 1, "Shopping", "food"),
        (unit4.id, 2, "People", "users"),
    ]
    skills = []
    prev_skill_id = None
    for unit_id, order, title, icon in skills_data:
        s = Skill(unit_id=unit_id, order=order, title=title, icon=icon,
                   unlock_requires_skill_id=prev_skill_id, max_crowns=5)
        session.add(s)
        session.flush()
        skills.append(s)
        prev_skill_id = s.id

    def add_exercises(lesson: Lesson, items: list[dict]) -> None:
        for i, item in enumerate(items, start=1):
            session.add(Exercise(
                lesson_id=lesson.id, order=i,
                type=item["type"], prompt=item["prompt"],
                content=item["content"], correct_answer=item["correct_answer"],
            ))

    greetings_l1 = Lesson(skill_id=skills[0].id, order=1, type=LessonType.NORMAL, xp_reward=10)
    session.add(greetings_l1)
    session.flush()
    add_exercises(greetings_l1, [
        {
            "type": ExerciseType.MULTIPLE_CHOICE,
            "prompt": "How do you say 'hello' in Spanish?",
            "content": {"options": ["Hola", "Adiós", "Gracias", "Por favor"]},
            "correct_answer": "Hola",
        },
        {
            "type": ExerciseType.TRANSLATE,
            "prompt": "Translate: 'Good morning'",
            "content": {"word_bank": ["Buenos", "días", "noches", "Hola", "tardes"]},
            "correct_answer": ["Buenos", "días"],
        },
        {
            "type": ExerciseType.TYPE_ANSWER,
            "prompt": "Type the Spanish word for 'thank you'",
            "content": {},
            "correct_answer": "gracias",
        },
        {
            "type": ExerciseType.SPEAK,
            "prompt": "Speak this sentence: 'Hola, buenos días'",
            "content": {"sentence": "Hola, buenos días"},
            "correct_answer": "Hola, buenos días",
        },
    ])

    greetings_l2 = Lesson(skill_id=skills[0].id, order=2, type=LessonType.NORMAL, xp_reward=10)
    session.add(greetings_l2)
    session.flush()
    add_exercises(greetings_l2, [
        {
            "type": ExerciseType.MATCH_PAIRS,
            "prompt": "Match the pairs",
            "content": {"pairs": [["Hola", "Hello"], ["Adiós", "Goodbye"], ["Gracias", "Thank you"]]},
            "correct_answer": [["Hola", "Hello"], ["Adiós", "Goodbye"], ["Gracias", "Thank you"]],
        },
        {
            "type": ExerciseType.FILL_BLANK,
            "prompt": "Buenas ___, señor (Good afternoon, sir)",
            "content": {"sentence": "Buenas ___, señor", "options": ["tardes", "días", "noches"]},
            "correct_answer": "tardes",
        },
        {
            "type": ExerciseType.SPEAK,
            "prompt": "Speak this sentence: 'Gracias, adiós'",
            "content": {"sentence": "Gracias, adiós"},
            "correct_answer": "Gracias, adiós",
        },
    ])

    for skill in skills[1:]:
        lesson = Lesson(skill_id=skill.id, order=1, type=LessonType.NORMAL, xp_reward=10)
        session.add(lesson)
        session.flush()
        add_exercises(lesson, [
            {
                "type": ExerciseType.MULTIPLE_CHOICE,
                "prompt": f"Choose the correct translation for {skill.title}",
                "content": {"options": ["Option A", "Option B", "Option C", "Option D"]},
                "correct_answer": "Option A",
            },
            {
                "type": ExerciseType.TYPE_ANSWER,
                "prompt": f"Type a sample answer for {skill.title}",
                "content": {},
                "correct_answer": "answer",
            },
        ])

    ach_streak_3 = Achievement(name="On a Roll", description="Reach a 3-day streak",
                                icon="flame", criteria_type="streak", criteria_value=3)
    ach_first_skill = Achievement(name="First Steps", description="Complete your first skill",
                                   icon="award", criteria_type="skills_completed", criteria_value=1)
    session.add_all([ach_streak_3, ach_first_skill])
    session.flush()

    demo = User(username="Ankit", email="Ankit@example.com",
                password_hash="not-a-real-hash", total_xp=40, gems=500,
                hearts=5, max_hearts=5, daily_xp_goal=30)
    seeded2 = User(username="maria", email="maria@example.com",
                   password_hash="not-a-real-hash", total_xp=120, gems=500)
    seeded3 = User(username="sam", email="sam@example.com",
                   password_hash="not-a-real-hash", total_xp=75, gems=500)
    session.add_all([demo, seeded2, seeded3])
    session.flush()

    session.add_all([
        UserSkillProgress(user_id=demo.id, skill_id=skills[0].id,
                           status=SkillStatus.COMPLETED, crown_level=1,
                           xp_earned=20, last_practiced_at=datetime.utcnow() - timedelta(days=1)),
        UserSkillProgress(user_id=demo.id, skill_id=skills[1].id,
                           status=SkillStatus.AVAILABLE, crown_level=0, xp_earned=0),
    ])

    attempt = LessonAttempt(user_id=demo.id, lesson_id=greetings_l1.id,
                             started_at=datetime.utcnow() - timedelta(days=1, minutes=10),
                             completed_at=datetime.utcnow() - timedelta(days=1),
                             hearts_lost=1, xp_earned=10, passed=True)
    session.add(attempt)
    session.flush()
    first_exercise = greetings_l1.exercises[0]
    session.add(ExerciseAttempt(lesson_attempt_id=attempt.id, exercise_id=first_exercise.id,
                                 user_answer="Hola", is_correct=True))

    today = datetime.utcnow().date()
    for offset in (3, 2, 1):
        session.add(DailyActivity(
            user_id=demo.id,
            activity_date=datetime.combine(today - timedelta(days=offset), datetime.min.time()),
            xp_earned=30, goal_met=True,
        ))

    session.commit()
    print("Seed complete.")


def main() -> None:
    engine = create_engine(DATABASE_URL, echo=False)
    import app.models
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        seed(session)

if __name__ == "__main__":
    main()