# apps/AI/api/v1/feedback/feedback_schema.py

from pydantic import BaseModel, Field
from typing import List, Optional

# Spring boot에서 동화책 읽기 피드백 요청 올 때 받을 데이터 (카멜케이스)
class SentencePair(BaseModel):
    sentenceId: Optional[int] = None
    original: str
    stt: str

# FastAPI에서 Spring boot로 응답해줄 때 줄 데이터
class FeedbackSections(BaseModel):
    accuracy: float = Field(ge=0, le=100)
    evaluation: str
    strengths: str          # 줄바꿈(\n)으로 구분된 불릿 권장
    improvements: str
    recommendations: str

# spring boot에서 초기진단 데이터 보낼 때 받을 데이터
class WordsPair(BaseModel):
    targetText: str
    sttText: str

