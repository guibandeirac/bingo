"""
Auditoria do evento: status, números sorteados e duplicatas no ranking.

Uso:
    python audit_event.py
"""

import os
import json
from pathlib import Path
from collections import Counter
import httpx
from dotenv import load_dotenv

root = Path(__file__).parent.parent
load_dotenv(root / ".env.local")

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}


def get(path, params=None):
    with httpx.Client(timeout=30) as c:
        r = c.get(f"{URL}/rest/v1/{path}", headers=H, params=params or {})
        r.raise_for_status()
        return r.json()


def dump(label, data):
    print(f"\n=== {label} ===")
    print(json.dumps(data, indent=2, default=str, ensure_ascii=False))


print("\n########## 1) EVENTS ##########")
events = get("events", {"select": "*", "order": "created_at.desc"})
dump("all events", events)

print("\n########## 2) BINGO_GAMES ##########")
games = get("bingo_games", {"select": "*", "order": "created_at.desc"})
dump("all games", games)

print("\n########## 3) BINGO_DRAWN_NUMBERS ##########")
drawn = get(
    "bingo_drawn_numbers",
    {"select": "*", "order": "drawn_at.desc", "limit": "500"},
)
print(f"total rows: {len(drawn)}")
if drawn:
    by_game = {}
    for d in drawn:
        by_game.setdefault(d["game_id"], []).append(d["number"])
    for gid, nums in by_game.items():
        print(f"\ngame_id={gid}  count={len(nums)}  unique={len(set(nums))}")
        dup = [n for n, c in Counter(nums).items() if c > 1]
        if dup:
            print(f"  duplicated numbers: {dup}")
        nums_sorted = sorted(set(nums))
        missing = [n for n in range(1, 76) if n not in set(nums)]
        print(f"  drawn (sorted): {nums_sorted}")
        print(f"  NOT drawn: {missing}")

print("\n########## 4) GAME_RESULTS ##########")
try:
    results = get("game_results", {"select": "*", "order": "created_at.desc"})
    dump("game_results", results)
except httpx.HTTPStatusError as e:
    print(f"no game_results: {e}")

print("\n########## 5) USERS (Denner?) ##########")
users = get(
    "users",
    {"select": "id,name,email,role", "order": "name.asc"},
)
denners = [u for u in users if "denner" in (u.get("name") or "").lower()
           or "denner" in (u.get("email") or "").lower()]
dump("denner matches", denners)
dump("total users", {"count": len(users)})
