import os, re, json
from typing import List, Dict, Any
import requests
from api.v1.feedback.feedback_schema import SentencePair, WordsPair, FeedbackSections
from dotenv import load_dotenv

load_dotenv()
GMS_API_KEY = os.getenv("GMS_API_KEY")
GMS_ENDPOINT = os.getenv("GMS_FEEDBACK_URL")
MODEL = "gpt-4o-mini"

# -------- 공통 유틸 --------

def _build_messages(prompt: str):
    return [
        {
            "role": "system",
            "content": (
                "너는 아동 언어평가 전문가(언어재활사)야. "
                "한국어로, 존댓말(~합니다) 체로 명료하게 설명해. "
                "학부모와 교사가 이해하기 쉬운 일상어로 쓰고, "
                "전문 용어를 써야 한다면 반드시 쉬운 표현으로 풀어 설명해(예: '끝소리가 잘 들리지 않습니다'). "
                "반드시 요구된 출력 형식(JSON Schema)만 반환해. "
                "평가와 예시는 오직 [데이터]에 주어진 원문/발화 텍스트만 근거로 삼아. "
                "새로운 예시나 임의 문장을 만들어 내지 마. "
                "전체 문장을 그대로 복사/붙여넣기 하지 말고, 인용이 필요하면 6글자 이내의 짧은 부분만 따옴표로 표시해. "
                "불필요한 머리말/코드블록/라벨을 덧붙이지 마."
                "Do not use bullet points, numbered lists, dashes, emojis, or line breaks. Write in full sentences."
            ),
        },
        {"role": "user", "content": prompt},
    ]


def _call_llm(messages) -> str:
    if not GMS_API_KEY or not GMS_ENDPOINT:
        raise RuntimeError("GMS_API_KEY 또는 GMS_FEEDBACK_URL이 설정되지 않았습니다.")

    headers = {"Authorization": f"Bearer {GMS_API_KEY}", "Content-Type": "application/json"}

    # 1순위: JSON Schema로 구조화 응답을 강제
    data = {
        "model": MODEL,
        "temperature": 0.2,
        "top_p": 0.1,
        "messages": messages,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "feedback_eval",
                "schema": {
                    "type": "object",
                    "properties": {
                        "accuracy": {"type": "number"}, # 발음정확도
                        "evaluation": {"type": "string"}, # 종합평가
                        "strengths": {"type": "string"},    # 강점
                        "improvements": {"type": "string"}, # 개선점
                        "recommendations": {"type": "string"}, # 개선방안
                    },
                      "required": ["accuracy", "evaluation", "strengths", "improvements", "recommendations"],
                    "additionalProperties": False,
                },
                # structured outputs에서 종종 필요한 필드. 미지원이면 제거해도 됨.
                "strict": True,
            },
        },
        "max_tokens": 900,
    }

    r = requests.post(GMS_ENDPOINT, headers=headers, json=data, timeout=120)
    r.raise_for_status()
    content = r.json()["choices"][0]["message"]["content"]
    return content

# ✅ 새 파서: 보고서(JSON) 파싱 → dict
def _parse_feedback_report(content: str) -> Dict[str, Any]:
    # 코드블록 제거
    if content.strip().startswith("```"):
        content = re.sub(r"```[a-zA-Z]*\n?", "", content).rstrip("`").strip()

    # 1) JSON 시도
    obj = json.loads(content)

    return {
    "accuracy": float(obj["accuracy"]),
    "evaluation": str(obj.get("evaluation","")).strip(),
    "strengths": str(obj.get("strengths","")).strip(),
    "improvements": str(obj.get("improvements","")).strip(),
    "recommendations": str(obj.get("recommendations","")).strip(),
}

   

def _clamp_accuracy(x: float) -> float:
    if x < 0: return 0.0
    if x > 100: return 100.0
    return x

# -------- 프롬프트 템플릿 --------

def _prompt_for_sentences(sentences: List[SentencePair], extra_context: str = "") -> str:
    """
    동화책 문장 기반 수업 평가 프롬프트
    - 실제 원문/발화 텍스트를 [데이터] 섹션에 태그로 포함
    - '새 예시 금지', '짧은 부분 인용만 허용'을 강하게 고정
    - 언어능력 평가는 300자 내외 + 근거 예시(문장쌍 번호와 짧은 인용) 1~2줄
    """
    prompt = (
        "아동의 낭독(STT)과 원문(정답)을 비교하여 0~100의 발화 정확도를 산출하고, "
        "다음 4개 섹션으로 보고서를 작성합니다. "
        "부모/교사가 바로 실천할 수 있는 제안을 포함합니다.\n\n"
        "[평가 기준]\n"
        "- 정확도 산출(0~100, 소수점 허용)\n"
        "- 언어능력 평가: 수용/표현의 균형, 발음의 또렷함, 문법 사용, 어휘 선택, 문맥 이해를 쉬운 표현으로 종합합니다. "
        "‘언어능력 평가’는 300자 내외(±15%)로 작성하고, 끝에 '근거 예시:' 1~2줄을 덧붙입니다.\n"
        "- 근거는 오직 [데이터]의 문장쌍에서만 발췌합니다. 새로운 예시를 만들지 않습니다. "
        "전체 문장을 그대로 복사하지 말고, 최대 6글자 이내의 짧은 부분만 따옴표로 인용합니다. "
        "- 강점/개선 필요/제안사항은 모두 일상어로 구체적으로 서술합니다.\n\n"
        "[출력 형식(JSON)]\n"
        '{'
        '"accuracy": <number>, '
        '"evaluation": <string> '
        '"strengths": <string> '
        '"improvements": <string> '
        '"recommendations": <string>'
        '}\n\n'
        "[데이터]\n"
    )

    # 실제 텍스트를 태그로 제공 (모델이 참조할 수 있도록)
    for idx, s in enumerate(sentences, 1):
        prompt += (
            f"<PAIR index=\"{idx}\">\n"
            f"  <ORIG>{s.original}</ORIG>\n"
            f"  <STT>{s.stt}</STT>\n"
            f"</PAIR>\n"
        )

    if extra_context:
        prompt += f"\n[추가 문맥]\n{extra_context}\n"

    return prompt


def _prompt_for_words(words: List[WordsPair], extra_context: str = "") -> str:
    """
    초기진단(단어) 평가 프롬프트
    - 실제 목표/발화 텍스트를 [데이터] 섹션에 태그로 포함
    - '새 예시 금지', '짧은 부분 인용만 허용'을 강하게 고정
    - 언어능력 평가는 300자 내외 + 근거 예시(문항 번호와 짧은 인용) 1~2줄
    """
    prompt = (
        "아동의 단어 발화(STT)와 목표 단어를 비교하여 0~100의 발화 정확도를 산출하고, "
        "다음 4개 섹션으로 보고서를 작성합니다. "
        "입력 텍스트를 그대로 전부 나열하지 않습니다.\n\n"
        "[평가 기준]\n"
        "- 정확도 산출(0~100)\n"
        "- 언어능력 평가: 발음의 또렷함, 소리 빠짐 여부, 소리 바뀜 경향, 단어 떠올리기의 수월함 등을 쉬운 표현으로 종합합니다. "
        "‘언어능력 평가’는 300자 내외(±15%)로 작성하고, 끝에 '근거 예시:' 1~2줄을 덧붙입니다.\n"
        "- 근거는 오직 [데이터]의 단어쌍에서만 발췌합니다. 새로운 예시를 만들지 않습니다. "
        "전체 단어를 그대로 복사하지 말고, 최대 6글자 이내의 짧은 부분만 따옴표로 인용합니다. "
        "- 강점/개선 필요/제안사항은 모두 일상어로 구체적으로 씁니다.\n\n"
        "[출력 형식(JSON)]\n"
        '{'
        '"accuracy": <number>, '
        '"evaluation": <string> '
        '"strengths": <string> '
        '"improvements": <string> '
        '"recommendations": <string>'
        '}\n\n'
        "[데이터]\n"
    )

    for idx, w in enumerate(words, 1):
        prompt += (
            f"<ITEM index=\"{idx}\">\n"
            f"  <TARGET>{w.targetText}</TARGET>\n"
            f"  <STT>{w.sttText}</STT>\n"
            f"</ITEM>\n"
        )

    if extra_context:
        prompt += f"\n[추가 문맥]\n{extra_context}\n"

    return prompt


# -------- 실제 서비스 함수 --------
# (인터페이스: FeedbackSections(섹션별로))
def generate_feedback_response_sections(sentences: List[SentencePair]) -> FeedbackSections:
    prompt = _prompt_for_sentences(
        sentences,
        extra_context="설문 요약 예: 수용언어는 또래 수준, 표현언어에서 어말 정확도와 단어 인출 어려움.",
    )
    messages = _build_messages(prompt)
    content = _call_llm(messages)
    try:
        report = _parse_feedback_report(content)
        return FeedbackSections(
            accuracy=float(report["accuracy"]),
            evaluation=report["evaluation"],
            strengths=report["strengths"],
            improvements=report["improvements"],
            recommendations=report["recommendations"],
        )
    except Exception as e:
        snippet = content[:200].replace("\n", "\\n")
        raise ValueError(f"LLM_PARSE_ERROR: {e} | content_snippet='{snippet}'")

def generate_initial_feedback_response_sections(words: List[WordsPair]) -> FeedbackSections:
    prompt = _prompt_for_words(
        words,
        extra_context="초기진단은 10문항으로, 단어 인출·음운 오류·오류패턴 관찰에 중점.",
    )
    messages = _build_messages(prompt)
    content = _call_llm(messages)
    try:
        report = _parse_feedback_report(content)
        return FeedbackSections(
            accuracy=float(report["accuracy"]),
            evaluation=report["evaluation"],
            strengths=report["strengths"],
            improvements=report["improvements"],
            recommendations=report["recommendations"],
        )
    except Exception as e:
        snippet = content[:200].replace("\n", "\\n")
        raise ValueError(f"LLM_PARSE_ERROR: {e} | content_snippet='{snippet}'")