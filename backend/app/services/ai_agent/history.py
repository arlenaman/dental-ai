from app.models.message import Message, MessageDirection


def to_claude_messages(messages: list[Message]) -> list[dict]:
    return [
        {
            "role": "user" if m.direction == MessageDirection.INBOUND else "assistant",
            "content": m.body,
        }
        for m in messages
    ]
