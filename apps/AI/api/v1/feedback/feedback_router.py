from api.v1.feedback.feedback_schema import SentencePair, FeedbackSections, WordsPair
from typing import List
from fastapi import APIRouter
from .feedback_service import (
    generate_feedback_response_sections,
    generate_initial_feedback_response_sections,
)

router = APIRouter()

@router.post("/eval", response_model=FeedbackSections)
def evaluate_feedback(sentences: List[SentencePair]):
    """동화책 문장 기반: 요청 본문은 SentencePair 배열"""
    """동화책 문장 기반: 섹션 나눠서 응답"""
    return generate_feedback_response_sections(sentences)

@router.post("/initial-eval", response_model=FeedbackSections)
def evaluate_initial_feedback(words: List[WordsPair]):
    """초기진단(단어) 기반: 요청 본문은 WordsPair 배열"""   
    """초기진단(단어) 기반: 섹션 나눠서 응답"""
    return generate_initial_feedback_response_sections(words)



