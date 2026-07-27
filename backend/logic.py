from datetime import date, datetime, timedelta
from typing import Any, Optional

HEART_REGEN_INTERVAL = timedelta(minutes=30)


# ---------------------------------------------------------------------------
# Hearts
# ---------------------------------------------------------------------------

def compute_hearts(
    stored_hearts: int,
    max_hearts: int,
    hearts_last_lost_at: Optional[datetime],
    now: datetime,
) -> tuple[int, Optional[datetime]]:
    """
    Returns (current_hearts, next_regen_at).
    """
    if stored_hearts >= max_hearts or hearts_last_lost_at is None:
        return max_hearts if stored_hearts >= max_hearts else stored_hearts, None

    elapsed = now - hearts_last_lost_at
    regenerated = elapsed // HEART_REGEN_INTERVAL
    current = min(max_hearts, stored_hearts + regenerated)

    if current >= max_hearts:
        return max_hearts, None

    remainder = elapsed - (regenerated * HEART_REGEN_INTERVAL)
    next_regen_at = now + (HEART_REGEN_INTERVAL - remainder)
    return current, next_regen_at


# ---------------------------------------------------------------------------
# Streak
# ---------------------------------------------------------------------------

def compute_streak(activity_dates: list[date], today: date) -> int:
    """
    activity_dates: list of dates with activity met.
    """
    if not activity_dates:
        return 0

    days = set(activity_dates)
    most_recent = max(days)

    if (today - most_recent).days > 1:
        return 0  # streak broken

    streak = 0
    cursor = most_recent
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)

    return streak


def is_daily_goal_met(xp_earned_today: int, daily_goal: int) -> bool:
    return xp_earned_today >= daily_goal


# ---------------------------------------------------------------------------
# Answer checking
# ---------------------------------------------------------------------------

def check_answer(exercise_type: str, user_answer: Any, correct_answer: Any) -> bool:
    """
    Comparison rules per exercise type:
    - multiple_choice / fill_blank / type_answer: case-insensitive string match, trimmed.
    - translate: order-sensitive list of strings, case-insensitive.
    - match_pairs: order-INsensitive list of [a, b] pairs.
    """
    if exercise_type in ("multiple_choice", "fill_blank", "type_answer"):
        if not isinstance(user_answer, str) or not isinstance(correct_answer, str):
            return False
        return user_answer.strip().lower() == correct_answer.strip().lower()

    if exercise_type == "translate":
        if not isinstance(user_answer, list) or not isinstance(correct_answer, list):
            return False
        if len(user_answer) != len(correct_answer):
            return False
        return all(
            str(a).strip().lower() == str(b).strip().lower()
            for a, b in zip(user_answer, correct_answer)
        )

    if exercise_type == "match_pairs":
        if not isinstance(user_answer, list) or not isinstance(correct_answer, list):
            return False
        norm_user = {tuple(sorted(pair)) for pair in user_answer}
        norm_correct = {tuple(sorted(pair)) for pair in correct_answer}
        return norm_user == norm_correct

    if exercise_type == "speak":
        return True

    return False
