"""
Smoke test: verifica se o Supabase está acessível e as tabelas existem.

Uso:
    python check_supabase_health.py
"""

import os
import sys
import httpx
from pathlib import Path
from dotenv import load_dotenv

root = Path(__file__).parent.parent
load_dotenv(root / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
}

TABLES = [
    "users", "events", "event_participants",
    "bingo_games", "bingo_drawn_numbers", "bingo_cards",
    "uno_tournaments", "uno_duos", "uno_bracket_matches",
    "uno_individual_finals", "game_results",
]

all_ok = True

with httpx.Client(timeout=15) as client:
    for table in TABLES:
        resp = client.get(
            f"{SUPABASE_URL}/rest/v1/{table}?limit=1",
            headers=HEADERS,
        )
        ok = resp.status_code == 200
        icon = "✓" if ok else "✗"
        print(f"  {icon} {table} → HTTP {resp.status_code}")
        if not ok:
            all_ok = False

sys.exit(0 if all_ok else 1)
