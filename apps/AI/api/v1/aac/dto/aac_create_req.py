from typing import Optional
from pydantic import BaseModel

class AacImageRequest(BaseModel):
    situation: Optional[str] = None
    action: Optional[str] = None
    emotion: Optional[str] = None
    reason: Optional[str] = None