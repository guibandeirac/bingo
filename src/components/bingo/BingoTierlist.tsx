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
        {winners.map((w) => (
          <div key={w.user_id} className="flex items-center gap-3">
            <span className="text-xl">{MEDALS[w.position - 1]}</span>
            <span className="font-semibold text-gray-800 flex-1">{w.name}</span>
            <span className="text-sm text-gray-500 font-mono tabular-nums">
              {w.completed_at ? toBrasiliaTime(w.completed_at) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
