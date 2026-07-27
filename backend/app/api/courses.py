from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.config import DEFAULT_USER_ID
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/{course_id}/path", response_model=schemas.CoursePathOut)
def get_course_path(
    course_id: int,
    db: Session = Depends(get_db),
):
    user_id = DEFAULT_USER_ID
    course = db.get(models.Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    progress_rows = db.query(models.UserSkillProgress).filter_by(user_id=user_id).all()
    progress_by_skill = {p.skill_id: p for p in progress_rows}

    units_out = []
    for unit in course.units:
        skills_out = []
        for skill in unit.skills:
            progress = progress_by_skill.get(skill.id)
            if progress:
                status, crown_level = progress.status, progress.crown_level
            elif skill.unlock_requires_skill_id is None:
                status, crown_level = models.SkillStatus.AVAILABLE, 0
            else:
                prereq = progress_by_skill.get(skill.unlock_requires_skill_id)
                unlocked = prereq is not None and prereq.status == models.SkillStatus.COMPLETED
                status = models.SkillStatus.AVAILABLE if unlocked else models.SkillStatus.LOCKED
                crown_level = 0

            skill_out = schemas.SkillOut.model_validate(skill)
            skill_out.status = status
            skill_out.crown_level = crown_level
            skills_out.append(skill_out)

        unit_out = schemas.UnitOut.model_validate(unit)
        unit_out.skills = skills_out
        units_out.append(unit_out)

    course_out = schemas.CoursePathOut.model_validate(course)
    course_out.units = units_out
    return course_out