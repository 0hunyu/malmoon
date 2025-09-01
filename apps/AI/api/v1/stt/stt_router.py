from fastapi import APIRouter, UploadFile, File, HTTPException
from .stt_service import transcribe_to_text
from .stt_schema import TranscribeOut

router = APIRouter()

@router.post("/transcribe", response_model=TranscribeOut)
async def transcribe(file: UploadFile = File(...), language: str = "ko"):
    print("🟢 [FastAPI] 파일 수신 확인")
    print(f"🟢 [FastAPI] 파일 이름: {file.filename}")
    print(f"🟢 [FastAPI] Content-Type: {file.content_type}")
    
    return await transcribe_to_text(file, language)


