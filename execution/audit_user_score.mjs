// Audita pontuação do usuário guilhermecoutinho@botconversa.com.br
// e lista eventos recentes com resultados vinculados.
// Executa com: node execution/audit_user_score.mjs

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
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${URL}/rest/v1/${path}${qs ? "?" + qs : ""}`, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${path}: ${await r.text()}`);
  return r.json();
}

// 1) Achar o user — tabela users não tem email, filtra por nome
const users = await get("users", { select: "id,name,phone,role", order: "name.asc" });
console.log("\n=== USER candidates (nome Guilherme) ===");
const candidates = users.filter((u) => (u.name || "").toLowerCase().includes("guilherme"));
for (const u of candidates) console.log(`  ${u.id}  ${u.name}  role=${u.role}`);
const candidate = candidates.find((u) => u.role === "admin") ?? candidates[0];
if (!candidate) {
  console.log("Nenhum usuário casou. Lista de todos:");
  console.log(JSON.stringify(users, null, 2));
  process.exit(1);
}
const userId = candidate.id;
console.log(`user_id = ${userId}, name = ${candidate.name}`);

// 2) Todos os eventos, ordenados por created_at
console.log("\n=== EVENTS (por created_at desc) ===");
const events = await get("events", { select: "*", order: "created_at.desc" });
for (const e of events) {
  console.log(`  ${e.id}  created=${e.created_at}  name="${e.name}"  status=${e.status}`);
}

// 3) game_results do usuário (todos)
console.log("\n=== GAME_RESULTS deste usuário ===");
const results = await get("game_results", {
  select: "*",
  user_id: `eq.${userId}`,
  order: "achieved_at.asc",
});
let total = 0;
for (const r of results) {
  total += r.points;
  console.log(
    `  evt=${r.event_id}  game=${r.game_type}  pos=${r.position}  pts=${r.points}  achieved=${r.achieved_at}  (running total=${total})`
  );
}
console.log(`TOTAL atual: ${total} pts`);

// 4) Bingo_games e bingo_cards deste usuário agrupados por evento recente
console.log("\n=== BINGO_GAMES por evento ===");
const games = await get("bingo_games", { select: "*", order: "created_at.desc" });
for (const g of games) {
  console.log(`  game=${g.id}  event=${g.event_id}  status=${g.status}  mode=${g.game_mode ?? "(null)"}  created=${g.created_at}`);
}

console.log("\n=== BINGO_CARDS deste usuário (com evento correspondente) ===");
const cards = await get("bingo_cards", {
  select: "id,game_id,user_id,position,completed_at",
  user_id: `eq.${userId}`,
});
for (const c of cards) {
  const g = games.find((x) => x.id === c.game_id);
  console.log(
    `  card=${c.id}  game=${c.game_id}  event=${g?.event_id}  pos=${c.position}  completed=${c.completed_at}`
  );
}
