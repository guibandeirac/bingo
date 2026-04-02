"use client";
import { useState } from "react";
import type { DbUnoIndividualFinal, DbUser } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  finals: DbUnoIndividualFinal[];
  usersMap: Map<string, DbUser>;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

const MATCH_LABELS: Record<string, string> = {
  first_second: "1º vs 2º lugar",
  third_fourth: "3º vs 4º lugar",
  fifth_sixth: "5º vs 6º lugar (apenas 5º pontua)",
};

export default function IndividualFinals({ finals, usersMap, isAdmin, onUpdate }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSetWinner(finalId: string, winnerId: string) {
    setLoading(finalId);
    await supabase.from("uno_individual_finals").update({ winner_id: winnerId }).eq("id", finalId);
    onUpdate?.();
    setLoading(null);
  }

  if (!finals.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Finais Individuais (1x1)</h3>
      {finals.map((f) => {
        const p1 = usersMap.get(f.player1_id);
        const p2 = usersMap.get(f.player2_id);
        const winner = f.winner_id ? usersMap.get(f.winner_id) : null;

        return (
          <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 font-medium mb-3">{MATCH_LABELS[f.match_type]}</p>
            <div className="flex gap-3">
              {[{ user: p1, id: f.player1_id }, { user: p2, id: f.player2_id }].map(({ user, id }) => (
                <button
                  key={id}
                  onClick={() => isAdmin && !f.winner_id && handleSetWinner(f.id, id)}
                  disabled={!!f.winner_id || !isAdmin || loading === f.id}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    f.winner_id === id
                      ? "bg-green-100 text-green-800 border-2 border-green-400"
                      : f.winner_id && f.winner_id !== id
                      ? "bg-gray-50 text-gray-400"
                      : isAdmin
                      ? "bg-gray-100 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                      : "bg-gray-100"
                  }`}
                >
                  {user?.name ?? "—"}
                  {f.winner_id === id && " 🏆"}
                </button>
              ))}
            </div>
            {winner && (
              <p className="text-xs text-green-600 font-medium mt-2 text-center">
                Vencedor: {winner.name}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
