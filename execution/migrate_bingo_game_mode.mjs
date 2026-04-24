// Aplica a migration 011_bingo_game_mode: adiciona coluna game_mode em bingo_games.
// Executa com: node execution/migrate_bingo_game_mode.mjs
//
// Aditiva e idempotente: usa "add column if not exists" e check constraint condicional.
// Pré-requisito: função public.exec_sql já criada no Supabase (migration 009).

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const SQL = `
alter table public.bingo_games
  add column if not exists game_mode text not null default 'full';

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'bingo_games'
      and constraint_name = 'bingo_games_game_mode_check'
  ) then
    alter table public.bingo_games
      add constraint bingo_games_game_mode_check
      check (game_mode in ('full', 'border', 'x'));
  end if;
end;
$$;
`;

const r = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ sql: SQL }),
});

if (r.ok) {
  console.log(`✓ migration 011_bingo_game_mode aplicada (HTTP ${r.status})`);
} else {
  console.error(`✗ falha: HTTP ${r.status}`);
  console.error(await r.text());
  process.exit(1);
}

// Verifica
const check = await fetch(
  `${URL}/rest/v1/bingo_games?select=id,game_mode&limit=1`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
);
if (check.ok) {
  console.log("✓ coluna game_mode selecionável:", await check.json());
} else {
  console.error("✗ select falhou:", check.status, await check.text());
  process.exit(1);
}
