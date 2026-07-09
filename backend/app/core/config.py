from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "local"
    database_url: str = "postgresql+asyncpg://localhost:5432/dental_ai_dev"

    jwt_secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    # Meta app-level settings (shared across all clinics' WhatsApp numbers,
    # since all tenants attach their number to the same registered Meta App).
    whatsapp_webhook_verify_token: str = "dev-verify-token-change-me"
    whatsapp_app_secret: str = "dev-app-secret-change-me"
    whatsapp_api_base_url: str = "https://graph.facebook.com/v21.0"

    anthropic_api_key: str = ""
    # Sonnet 5: near-Opus quality on tool-calling/agentic tasks (which is
    # what a booking/FAQ bot mostly does) at ~40% of the cost. Bump to
    # claude-opus-4-8 if live dialogs show it struggling on edge cases.
    anthropic_model: str = "claude-sonnet-5"


settings = Settings()
