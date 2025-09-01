from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.v1.aac.aac_router import router as aac_router
from api.v1.feedback.feedback_router import router as feedback_router
from api.v1.stt.stt_router import router as stt_router

load_dotenv()
app = FastAPI()

# CORS (운영 도메인도 추가 권장)
origins = [
    "http://localhost:3000",
    "https://www.malmoon.store",
    "https://malmoon.store",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ✅ WORKDIR가 /apps/AI 이므로 정적경로는 그냥 "static"
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}


# 라우터 등록
app.include_router(aac_router, prefix="/api/v1/aacs", tags=["AAC"])
app.include_router(stt_router, prefix="/api/v1/stt", tags=["STT"])
app.include_router(feedback_router, prefix="/api/v1/feedback", tags=["Feedback"])


@app.get("/")
def root():
    return {"message": "AI API is running"}
