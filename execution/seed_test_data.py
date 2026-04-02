"""
Cria dados de teste: 1 admin + 8 jogadores + 1 evento aberto.

Uso:
    pip install -r requirements.txt
    python seed_test_data.py
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

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("ERRO: defina as variáveis de ambiente em .env.local")
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

USERS = [
    {"name": "Admin Teste", "phone": "11900000001", "password": "senha123", "role": "admin"},
    {"name": "João Silva", "phone": "11900000002", "password": "senha123", "role": "player"},
    {"name": "Maria Santos", "phone": "11900000003", "password": "senha123", "role": "player"},
    {"name": "Pedro Oliveira", "phone": "11900000004", "password": "senha123", "role": "player"},
    {"name": "Ana Costa", "phone": "11900000005", "password": "senha123", "role": "player"},
    {"name": "Lucas Lima", "phone": "11900000006", "password": "senha123", "role": "player"},
    {"name": "Carla Souza", "phone": "11900000007", "password": "senha123", "role": "player"},
    {"name": "Marcos Pereira", "phone": "11900000008", "password": "senha123", "role": "player"},
    {"name": "Fernanda Alves", "phone": "11900000009", "password": "senha123", "role": "player"},
]


def phone_to_email(phone: str) -> str:
    normalized = phone.replace(r"\D", "").lstrip("55")
    return f"{normalized}@botconversa.games"


def create_user(client: httpx.Client, user: dict) -> str | None:
    email = f"{user['phone']}@botconversa.games"
    resp = client.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={
            "email": email,
            "password": user["password"],
            "email_confirm": True,
            "user_metadata": {"name": user["name"], "phone": user["phone"]},
        },
    )
    if resp.status_code in (200, 201):
        uid = resp.json().get("id")
        print(f"  ✓ Criado: {user['name']} ({email}) → {uid}")
        return uid
    else:
        print(f"  ✗ Erro ao criar {user['name']}: {resp.text[:200]}")
        return None


def promote_to_admin(client: httpx.Client, user_id: str) -> None:
    resp = client.patch(
        f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json={"role": "admin"},
    )
    if resp.status_code in (200, 204):
        print(f"  ✓ Promovido a admin: {user_id}")
    else:
        print(f"  ✗ Erro ao promover: {resp.text[:200]}")


def main() -> None:
    print("Criando dados de teste...\n")
    user_ids: list[str] = []

    with httpx.Client(timeout=30) as client:
        for i, user in enumerate(USERS):
            uid = create_user(client, user)
            if uid:
                user_ids.append(uid)
                if user["role"] == "admin":
                    promote_to_admin(client, uid)

        if not user_ids:
            print("Nenhum usuário criado. Abortando.")
            return

        admin_id = user_ids[0]

        # Criar evento
        resp = client.post(
            f"{SUPABASE_URL}/rest/v1/events",
            headers={**HEADERS, "Prefer": "return=representation"},
            json={
                "name": "Sexta de Jogos — Teste",
                "date": "2026-04-04",
                "status": "open",
                "created_by": admin_id,
            },
        )
        if resp.status_code in (200, 201):
            event = resp.json()[0]
            event_id = event["id"]
            print(f"\n  ✓ Evento criado: {event_id}")
        else:
            print(f"\n  ✗ Erro ao criar evento: {resp.text[:200]}")
            return

        # Inscrever todos os usuários
        participants = [{"event_id": event_id, "user_id": uid} for uid in user_ids]
        resp = client.post(
            f"{SUPABASE_URL}/rest/v1/event_participants",
            headers={**HEADERS, "Prefer": "return=minimal"},
            json=participants,
        )
        if resp.status_code in (200, 201, 204):
            print(f"  ✓ {len(participants)} participantes inscritos")
        else:
            print(f"  ✗ Erro ao inscrever participantes: {resp.text[:200]}")

    print("\nSeed concluído!")
    print(f"\nLogin do admin: 11900000001@botconversa.games / senha123")
    print(f"Login jogador:  11900000002@botconversa.games / senha123")


if __name__ == "__main__":
    main()
