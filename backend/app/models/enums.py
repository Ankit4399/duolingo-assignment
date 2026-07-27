from enum import Enum as PyEnum

class ExerciseType(str, PyEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE = "translate"          # word bank / tap-the-words
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"
    SPEAK = "speak"


class SkillStatus(str, PyEnum):
    LOCKED = "locked"
    AVAILABLE = "available"
    COMPLETED = "completed"


class LessonType(str, PyEnum):
    NORMAL = "normal"
    PRACTICE = "practice"
    LEGENDARY = "legendary"
