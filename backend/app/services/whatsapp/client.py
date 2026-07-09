import httpx


class WhatsAppClient:
    """Thin wrapper around the Meta Cloud API /messages endpoint.

    Works as-is against Meta's own Cloud API and against BSPs (e.g. 360dialog)
    that proxy the same request/response shape.
    """

    def __init__(self, phone_number_id: str, access_token: str, base_url: str):
        self._phone_number_id = phone_number_id
        self._access_token = access_token
        self._base_url = base_url.rstrip("/")

    async def send_text_message(self, to: str, body: str) -> dict:
        url = f"{self._base_url}/{self._phone_number_id}/messages"
        headers = {"Authorization": f"Bearer {self._access_token}"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body},
        }
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
