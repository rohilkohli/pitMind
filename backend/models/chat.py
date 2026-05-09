from typing import Any

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=8000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    telemetry_context: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    reply: str


class DebriefResponse(BaseModel):
    report_markdown: str
    source_note: str
