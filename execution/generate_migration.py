"""
Aplica todas as migrations do BotConversa Games no Supabase.

Uso:
    pip install -r requirements.txt
    python generate_migration.py

Requer .env.local na raiz do projeto com:
    NEXT_PUBLIC_SUPABASE_URL=...
    SUPABASE_SERVICE_ROLE_KEY=...
"""

import os
import sys
import httpx
from pathlib import Path
from dotenv import load_dotenv

# Carrega .env.local da raiz do projeto
root = Path(__file__).parent.parent
load_dotenv(root / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    print("ERRO: Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local")
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

SQL_ENDPOINT = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"


def run_sql(sql: str, label: str) -> None:
    """Executa SQL via Supabase REST API usando a função exec_sql RPC."""
    resp = httpx.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=HEADERS,
        json={"sql": sql},
        timeout=30,
    )
    if resp.status_code in (200, 204):
        print(f"  ✓ {label}")
    else:
        print(f"  ✗ {label} — HTTP {resp.status_code}: {resp.text[:200]}")


# Migrations em ordem
MIGRATIONS = [
    (
        "001_extensions_and_enums",
        """
        create extension if not exists "uuid-ossp";

        do $$ begin
          create type user_role as enum ('player', 'admin');
        exception when duplicate_object then null; end $$;

        do $$ begin
          create type event_status as enum ('open', 'in_progress', 'finished');
        exception when duplicate_object then null; end $$;

        do $$ begin
          create type bingo_game_status as enum ('waiting', 'cards_generated', 'in_progress', 'finished');
        exception when duplicate_object then null; end $$;

        do $$ begin
          create type uno_tournament_status as enum ('draft', 'duos_generated', 'bracket_generated', 'in_progress', 'finals', 'finished');
        exception when duplicate_object then null; end $$;

        do $$ begin
          create type bracket_type as enum ('winners', 'losers', 'grand_final');
        exception when duplicate_object then null; end $$;

        do $$ begin
          create type individual_final_type as enum ('first_second', 'third_fourth', 'fifth_sixth');
        exception when duplicate_object then null; end $$;

        do $$ begin
          create type game_type as enum ('bingo', 'uno');
        exception when duplicate_object then null; end $$;
        """,
    ),
    (
        "002_core_tables",
        """
        create table if not exists public.users (
          id uuid primary key references auth.users(id) on delete cascade,
          name text not null,
          phone text not null,
          role user_role not null default 'player',
          created_at timestamptz not null default now()
        );

        do $$ begin
          alter table public.users add constraint users_phone_unique unique (phone);
        exception when duplicate_table then null;
                 when duplicate_object then null; end $$;

        create table if not exists public.events (
          id uuid primary key default uuid_generate_v4(),
          name text not null,
          date date not null,
          status event_status not null default 'open',
          created_by uuid not null references public.users(id),
          created_at timestamptz not null default now()
        );

        create table if not exists public.event_participants (
          id uuid primary key default uuid_generate_v4(),
          event_id uuid not null references public.events(id) on delete cascade,
          user_id uuid not null references public.users(id) on delete cascade,
          joined_at timestamptz not null default now(),
          unique(event_id, user_id)
        );
        """,
    ),
    (
        "003_bingo_tables",
        """
        create table if not exists public.bingo_games (
          id uuid primary key default uuid_generate_v4(),
          event_id uuid not null references public.events(id) on delete cascade,
          status bingo_game_status not null default 'waiting',
          auto_mode boolean not null default false,
          auto_interval_seconds integer,
          started_at timestamptz,
          created_at timestamptz not null default now()
        );

        create table if not exists public.bingo_drawn_numbers (
          id uuid primary key default uuid_generate_v4(),
          game_id uuid not null references public.bingo_games(id) on delete cascade,
          number integer not null check (number >= 1 and number <= 90),
          drawn_at timestamptz not null default now(),
          unique(game_id, number)
        );

        create table if not exists public.bingo_cards (
          id uuid primary key default uuid_generate_v4(),
          game_id uuid not null references public.bingo_games(id) on delete cascade,
          user_id uuid not null references public.users(id) on delete cascade,
          numbers jsonb not null,
          marked_numbers jsonb not null default '[]'::jsonb,
          completed_at timestamptz,
          position integer check (position >= 1 and position <= 5),
          unique(game_id, user_id)
        );
        """,
    ),
    (
        "004_uno_tables",
        """
        create table if not exists public.uno_tournaments (
          id uuid primary key default uuid_generate_v4(),
          event_id uuid not null references public.events(id) on delete cascade,
          status uno_tournament_status not null default 'draft',
          created_at timestamptz not null default now()
        );

        create table if not exists public.uno_duos (
          id uuid primary key default uuid_generate_v4(),
          tournament_id uuid not null references public.uno_tournaments(id) on delete cascade,
          player1_id uuid not null references public.users(id),
          player2_id uuid not null references public.users(id),
          seed integer not null
        );

        create table if not exists public.uno_bracket_matches (
          id uuid primary key default uuid_generate_v4(),
          tournament_id uuid not null references public.uno_tournaments(id) on delete cascade,
          bracket_type bracket_type not null,
          round integer not null,
          match_number integer not null,
          duo1_id uuid references public.uno_duos(id),
          duo2_id uuid references public.uno_duos(id),
          winner_id uuid references public.uno_duos(id),
          is_bye boolean not null default false,
          next_winner_match_id uuid references public.uno_bracket_matches(id),
          next_loser_match_id uuid references public.uno_bracket_matches(id)
        );

        create table if not exists public.uno_individual_finals (
          id uuid primary key default uuid_generate_v4(),
          tournament_id uuid not null references public.uno_tournaments(id) on delete cascade,
          match_type individual_final_type not null,
          player1_id uuid not null references public.users(id),
          player2_id uuid not null references public.users(id),
          winner_id uuid references public.users(id)
        );

        create table if not exists public.game_results (
          id uuid primary key default uuid_generate_v4(),
          event_id uuid not null references public.events(id) on delete cascade,
          game_type game_type not null,
          game_id uuid not null,
          user_id uuid not null references public.users(id),
          position integer not null check (position >= 1 and position <= 5),
          points integer not null,
          achieved_at timestamptz not null default now()
        );
        """,
    ),
    (
        "005_indexes",
        """
        create index if not exists idx_ep_event_id on public.event_participants(event_id);
        create index if not exists idx_ep_user_id on public.event_participants(user_id);
        create index if not exists idx_bdn_game_id on public.bingo_drawn_numbers(game_id);
        create index if not exists idx_bc_game_id on public.bingo_cards(game_id);
        create index if not exists idx_bc_user_id on public.bingo_cards(user_id);
        create index if not exists idx_ubm_tournament_id on public.uno_bracket_matches(tournament_id);
        create index if not exists idx_gr_user_id on public.game_results(user_id);
        create index if not exists idx_gr_event_id on public.game_results(event_id);
        create index if not exists idx_gr_achieved_at on public.game_results(achieved_at);
        """,
    ),
    (
        "006_rls",
        """
        alter table public.users enable row level security;
        alter table public.events enable row level security;
        alter table public.event_participants enable row level security;
        alter table public.bingo_games enable row level security;
        alter table public.bingo_drawn_numbers enable row level security;
        alter table public.bingo_cards enable row level security;
        alter table public.uno_tournaments enable row level security;
        alter table public.uno_duos enable row level security;
        alter table public.uno_bracket_matches enable row level security;
        alter table public.uno_individual_finals enable row level security;
        alter table public.game_results enable row level security;

        create or replace function public.is_admin()
        returns boolean language sql security definer
        as $$
          select exists (
            select 1 from public.users where id = auth.uid() and role = 'admin'
          );
        $$;

        -- users
        drop policy if exists "users_select" on public.users;
        create policy "users_select" on public.users for select to authenticated using (true);
        drop policy if exists "users_update_own" on public.users;
        create policy "users_update_own" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
        drop policy if exists "users_update_admin" on public.users;
        create policy "users_update_admin" on public.users for update to authenticated using (public.is_admin()) with check (public.is_admin());

        -- events
        drop policy if exists "events_select" on public.events;
        create policy "events_select" on public.events for select to authenticated using (true);
        drop policy if exists "events_insert" on public.events;
        create policy "events_insert" on public.events for insert to authenticated with check (public.is_admin());
        drop policy if exists "events_update" on public.events;
        create policy "events_update" on public.events for update to authenticated using (public.is_admin());

        -- event_participants
        drop policy if exists "ep_select" on public.event_participants;
        create policy "ep_select" on public.event_participants for select to authenticated using (true);
        drop policy if exists "ep_insert" on public.event_participants;
        create policy "ep_insert" on public.event_participants for insert to authenticated with check (user_id = auth.uid());
        drop policy if exists "ep_delete" on public.event_participants;
        create policy "ep_delete" on public.event_participants for delete to authenticated using (user_id = auth.uid() or public.is_admin());

        -- bingo_games
        drop policy if exists "bg_select" on public.bingo_games;
        create policy "bg_select" on public.bingo_games for select to authenticated using (true);
        drop policy if exists "bg_all_admin" on public.bingo_games;
        create policy "bg_all_admin" on public.bingo_games for all to authenticated using (public.is_admin()) with check (public.is_admin());

        -- bingo_drawn_numbers
        drop policy if exists "bdn_select" on public.bingo_drawn_numbers;
        create policy "bdn_select" on public.bingo_drawn_numbers for select to authenticated using (true);

        -- bingo_cards
        drop policy if exists "bc_select" on public.bingo_cards;
        create policy "bc_select" on public.bingo_cards for select to authenticated using (user_id = auth.uid() or public.is_admin());
        drop policy if exists "bc_update" on public.bingo_cards;
        create policy "bc_update" on public.bingo_cards for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

        -- uno_tournaments
        drop policy if exists "ut_select" on public.uno_tournaments;
        create policy "ut_select" on public.uno_tournaments for select to authenticated using (true);
        drop policy if exists "ut_all_admin" on public.uno_tournaments;
        create policy "ut_all_admin" on public.uno_tournaments for all to authenticated using (public.is_admin()) with check (public.is_admin());

        -- uno_duos
        drop policy if exists "ud_select" on public.uno_duos;
        create policy "ud_select" on public.uno_duos for select to authenticated using (true);
        drop policy if exists "ud_all_admin" on public.uno_duos;
        create policy "ud_all_admin" on public.uno_duos for all to authenticated using (public.is_admin()) with check (public.is_admin());

        -- uno_bracket_matches
        drop policy if exists "ubm_select" on public.uno_bracket_matches;
        create policy "ubm_select" on public.uno_bracket_matches for select to authenticated using (true);
        drop policy if exists "ubm_insert_admin" on public.uno_bracket_matches;
        create policy "ubm_insert_admin" on public.uno_bracket_matches for insert to authenticated with check (public.is_admin());
        drop policy if exists "ubm_update_admin" on public.uno_bracket_matches;
        create policy "ubm_update_admin" on public.uno_bracket_matches for update to authenticated using (public.is_admin());

        -- uno_individual_finals
        drop policy if exists "uif_select" on public.uno_individual_finals;
        create policy "uif_select" on public.uno_individual_finals for select to authenticated using (true);
        drop policy if exists "uif_all_admin" on public.uno_individual_finals;
        create policy "uif_all_admin" on public.uno_individual_finals for all to authenticated using (public.is_admin()) with check (public.is_admin());

        -- game_results
        drop policy if exists "gr_select" on public.game_results;
        create policy "gr_select" on public.game_results for select to authenticated using (true);
        """,
    ),
    (
        "007_trigger_new_user",
        """
        create or replace function public.handle_new_user()
        returns trigger language plpgsql security definer set search_path = public
        as $$
        begin
          insert into public.users (id, name, phone, role)
          values (
            new.id,
            coalesce(new.raw_user_meta_data->>'name', 'Sem nome'),
            coalesce(new.raw_user_meta_data->>'phone', ''),
            'player'
          )
          on conflict (id) do nothing;
          return new;
        end;
        $$;

        drop trigger if exists on_auth_user_created on auth.users;
        create trigger on_auth_user_created
          after insert on auth.users
          for each row execute function public.handle_new_user();
        """,
    ),
    (
        "008_realtime",
        """
        do $$
        begin
          begin
            alter publication supabase_realtime add table public.bingo_drawn_numbers;
          exception when others then null; end;
          begin
            alter publication supabase_realtime add table public.bingo_games;
          exception when others then null; end;
          begin
            alter publication supabase_realtime add table public.bingo_cards;
          exception when others then null; end;
          begin
            alter publication supabase_realtime add table public.uno_bracket_matches;
          exception when others then null; end;
          begin
            alter publication supabase_realtime add table public.event_participants;
          exception when others then null; end;
        end;
        $$;
        """,
    ),
    (
        "009_exec_sql_helper",
        """
        create or replace function public.exec_sql(sql text)
        returns void language plpgsql security definer
        as $$
        begin
          execute sql;
        end;
        $$;
        """,
    ),
]


def main() -> None:
    print(f"Conectando a {SUPABASE_URL}")
    print(f"Aplicando {len(MIGRATIONS)} migrations...\n")

    # A migration 009 cria exec_sql, então precisamos aplicar as demais via outro método.
    # Usamos o endpoint /rest/v1/rpc/exec_sql para as migrations 001-008 — mas ele só existe
    # após a 009 ser criada. Então vamos usar o endpoint SQL direto do Supabase (disponível
    # via Management API ou via dashboard). Aqui usamos o método alternativo via pg-rest.

    # NOTA: Para aplicar migrations sem exec_sql, use o Supabase Dashboard → SQL Editor.
    # Este script assume que exec_sql já existe (criada manualmente ou via dashboard).
    # Alternativamente, use a connection string direta com psycopg2.

    with httpx.Client(timeout=60) as client:
        for name, sql in MIGRATIONS:
            print(f"→ {name}")
            try:
                resp = client.post(
                    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
                    headers=HEADERS,
                    json={"sql": sql.strip()},
                )
                if resp.status_code in (200, 204):
                    print(f"  ✓ OK")
                else:
                    print(f"  ✗ HTTP {resp.status_code}: {resp.text[:300]}")
            except Exception as e:
                print(f"  ✗ Erro: {e}")

    print("\nMigrations concluídas.")
    print("\nSe houver erros de 'exec_sql não encontrada', aplique o SQL manualmente")
    print("no Supabase Dashboard → SQL Editor, começando pela migration 009.")


if __name__ == "__main__":
    main()
