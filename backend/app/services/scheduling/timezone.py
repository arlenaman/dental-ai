from zoneinfo import ZoneInfo

# MVP targets Kazakhstan, which uses a single national timezone (UTC+5).
# Revisit if/when the product needs per-clinic timezones.
CLINIC_TZ = ZoneInfo("Asia/Almaty")
