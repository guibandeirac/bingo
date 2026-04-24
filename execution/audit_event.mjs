// Auditoria: status do evento, números sorteados, duplicatas no ranking.
// Executa com: node execution/audit_event.mjs

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.startsWith("#"))
    .map(l => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${URL}/rest/v1/${path}${qs ? "?" + qs : ""}`;
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${url}: ${await r.text()}`);
  return r.json();
}

function dump(label, data) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

console.log("\n########## 1) EVENTS ##########");
const events = await get("events", { select: "*", order: "created_at.desc" });
dump("all events", events);

console.log("\n########## 2) BINGO_GAMES ##########");
const games = await get("bingo_games", { select: "*", order: "created_at.desc" });
dump("all games", games);

console.log("\n########## 3) BINGO_DRAWN_NUMBERS ##########");
const drawn = await get("bingo_drawn_numbers", {
  select: "*",
  order: "drawn_at.desc",
  limit: "1000",
});
console.log(`total rows: ${drawn.length}`);
const byGame = {};
for (const d of drawn) (byGame[d.game_id] ??= []).push(d.number);
for (const [gid, nums] of Object.entries(byGame)) {
  const uniq = new Set(nums);
  const counts = {};
  for (const n of nums) counts[n] = (counts[n] ?? 0) + 1;
  const dup = Object.entries(counts).filter(([, c]) => c > 1);
  const missing = [];
  for (let n = 1; n <= 75; n++) if (!uniq.has(n)) missing.push(n);
  console.log(`\ngame_id=${gid}  rows=${nums.length}  unique=${uniq.size}`);
  if (dup.length) console.log(`  DUPLICATES: ${JSON.stringify(dup)}`);
  console.log(`  drawn (sorted): [${[...uniq].sort((a,b)=>a-b).join(",")}]`);
  console.log(`  NOT drawn: [${missing.join(",")}]`);
}

console.log("\n########## 4) GAME_RESULTS ##########");
try {
  const results = await get("game_results", { select: "*", order: "created_at.desc" });
  dump("game_results", results);
} catch (e) {
  console.log(`(no game_results or error): ${e.message}`);
}

console.log("\n########## 5) USERS (Denner?) ##########");
const users = await get("users", { select: "id,name,email,role", order: "name.asc" });
const denners = users.filter(u =>
  (u.name || "").toLowerCase().includes("denner") ||
  (u.email || "").toLowerCase().includes("denner")
);
dump("denner matches", denners);
console.log(`total users: ${users.length}`);
