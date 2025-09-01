import os, requests, json
from fastapi import UploadFile, HTTPException
from .stt_schema import TranscribeOut
from dotenv import load_dotenv

load_dotenv()

GMS_URL = os.getenv("GMS_STT_URL")
GMS_API_KEY = os.getenv("GMS_API_KEY")

async def transcribe_to_text(file: UploadFile, language: str) -> TranscribeOut:
    if not GMS_API_KEY:
        raise HTTPException(status_code=500, detail="GMS_API_KEY is not set")

    files = {
        "file": (file.filename, await file.read(), file.content_type or "application/octet-stream")
    }
    data = {
        "model": "whisper-1",
            "response_format": "verbose_json",
            "language": language,
            "timestamp_granularities": '["word"]',
            # 아래는 '지원하면' 효과 볼 수 있는 옵션(모든 서버가 지원하진 않습니다)
            "temperature": "0",                       # 디코딩 온도 낮춰서 LM 영향 줄이기
            "condition_on_previous_text": "false",   # 이전 컨텍스트 영향 끄기 (지원 시)
            "prompt": "Transcribe exactly as spoken. Do not correct words or grammar.",  # 초기 지시(지원 시)
        }
    headers = {"Authorization": f"Bearer {GMS_API_KEY}"}

    try:
        r = requests.post(GMS_URL, headers=headers, data=data, files=files, timeout=120)
        print("🔵 [FastAPI → Whisper] 응답 코드:", r.status_code)
        print("🔵 [FastAPI → Whisper] 응답 내용:", r.text)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Proxy error: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    result = r.json()
    raw_text = result.get("text", "")

    # 🎯 {"text":"..."} 형태라면 평문으로 변환
    if isinstance(raw_text, str):
        s = raw_text.strip()
        if s.startswith("{") and s.endswith("}"):
            try:
                inner = json.loads(s)
                if isinstance(inner, dict) and "text" in inner:
                    raw_text = inner["text"]
            except json.JSONDecodeError:
                pass
    elif isinstance(raw_text, dict) and "text" in raw_text:
        raw_text = raw_text["text"]

    return TranscribeOut(text=raw_text or "")
