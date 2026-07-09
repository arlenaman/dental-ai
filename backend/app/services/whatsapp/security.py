import hashlib
import hmac


def verify_signature(app_secret: str, payload: bytes, signature_header: str | None) -> bool:
    """Verify Meta's X-Hub-Signature-256 header over the raw request body."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected = hmac.new(app_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    provided = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, provided)
