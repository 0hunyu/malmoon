from pydantic import BaseModel, AnyUrl

class AacImageResponse(BaseModel):
    previewUrl: AnyUrl
    preview_url: AnyUrl
