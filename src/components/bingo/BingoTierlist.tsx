"use client";
import { toBrasiliaTime } from "@/lib/utils";
import type { BingoWinner } from "@/types/database";

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

interface Props {
  winners: BingoWinner[];
}

export default function BingoTierlist({ winners }: Props) {
  if (!winners.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Classificação</p>
      <div className="space-y-2">
        {winners.map((w, i) => {
          const medal = w.position != null
            ? (MEDALS[w.position - 1] ?? `${w.position}º`)
            : `${i + 1}º`;
          const isTop5 = w.position != null && w.position <= 5;
          return (
            <div
              key={w.user_id}
              className={`flex items-center gap-3 rounded-lg px-2 py-1 ${isTop5 ? "bg-gray-50" : ""}`}
            >
              <span className="text-xl w-8 text-center shrink-0">{medal}</span>
              <span className={`font-semibold flex-1 min-w-0 truncate ${isTop5 ? "text-gray-800" : "text-gray-500"}`}>
                {w.name}
              </span>
              <span className="text-sm text-gray-400 font-mono tabular-nums shrink-0">
                {w.completed_at ? toBrasiliaTime(w.completed_at) : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
