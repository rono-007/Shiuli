from pydantic import BaseModel
from typing import Optional

class SendEmailRequest(BaseModel):
    email: str

class BetaUserResponse(BaseModel):
    name: str
    email: str
    email_status: str
    last_sent: Optional[str] = None
    attempt_count: int = 0
