from pydantic import BaseModel
from typing import Optional

class SendEmailRequest(BaseModel):
    email: str

class DirectInviteRequest(BaseModel):
    email: str
    name: Optional[str] = None
    pin: Optional[str] = None
    send_email: bool = True

class BetaUserResponse(BaseModel):
    name: str
    email: str
    email_status: str
    pin: Optional[str] = None
    last_sent: Optional[str] = None
    attempt_count: int = 0

