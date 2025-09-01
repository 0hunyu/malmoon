from fastapi import APIRouter
from .dto.aac_create_req import AacImageRequest
from .dto.aac_create_res import AacImageResponse
from .aac_ai_service import generate_preview_image

router = APIRouter()

@router.post("/generate", response_model=AacImageResponse)
def generate_image(req: AacImageRequest):
    url = generate_preview_image(req)
    return AacImageResponse(previewUrl=url, preview_url=url)