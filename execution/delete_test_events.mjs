// Deleta os dois eventos de teste criados em 2026-04-24 para validar a feature
// de modos de jogo (border, x). O cascade do Postgres remove bingo_games,
// bingo_drawn_numbers, bingo_cards, event_participants e game_results vinculados.

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "..", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const TEST_EVENT_IDS = [
  "4aaad855-9336-4944-b0f4-f2fe3afa6ca1", // "teste bingo 2" (modo x)
  "cee63475-4d19-4bae-bd09-47283f2959f8", // "Teste bingo" (modo border)
];

// Verifica antes: confirma que são mesmo os de teste (nome começa com "teste")
async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${URL}/rest/v1/${path}${qs ? "?" + qs : ""}`, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${path}: ${await r.text()}`);
  return r.json();
}

for (const id of TEST_EVENT_IDS) {
  const rows = await get("events", { select: "id,name,status,created_at", id: `eq.${id}` });
  if (!rows.length) {
    console.error(`✗ evento ${id} não encontrado — abortando por segurança`);
    process.exit(1);
  }
  const e = rows[0];
  if (!/teste/i.test(e.name)) {
    console.error(`✗ nome não bate com "teste": "${e.name}" (id=${id}) — abortando`);
    process.exit(1);
  }
  console.log(`  → confirmado: "${e.name}" (${e.created_at})`);
}

// Deleta via PostgREST (cascade ON DELETE cuida das tabelas filhas)
for (const id of TEST_EVENT_IDS) {
  const r = await fetch(`${URL}/rest/v1/events?id=eq.${id}`, { method: "DELETE", headers: H });
  if (r.status !== 200 && r.status !== 204) {
    console.error(`✗ falha ao deletar ${id}: HTTP ${r.status} — ${await r.text()}`);
    process.exit(1);
  }
  console.log(`✓ deletado event ${id}`);
}

// Verifica pontuação após delete
const userId = "23c392b4-07d8-4ae6-aac2-0f33337256cd"; // Guilherme Bandeira
const results = await get("game_results", {
  select: "event_id,points,position,game_type,achieved_at",
  user_id: `eq.${userId}`,
  order: "achieved_at.asc",
});
const total = results.reduce((s, r) => s + r.points, 0);
console.log("\n=== GAME_RESULTS após delete ===");
for (const r of results) {
  console.log(`  pos=${r.position}  pts=${r.points}  event=${r.event_id}  (${r.achieved_at})`);
}
console.log(`\nTOTAL: ${total} pts`);
