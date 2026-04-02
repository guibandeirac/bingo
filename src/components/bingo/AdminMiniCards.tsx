"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbBingoCard, DbUser } from "@/types/database";

interface CardWithUser extends DbBingoCard {
  userName: string;
}

interface Props {
  gameId: string;
  drawnNumbers: number[];
}

export default function AdminMiniCards({ gameId, drawnNumbers }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [cards, setCards] = useState<CardWithUser[]>([]);

  useEffect(() => {
    async function fetchCards() {
      const { data } = await supabase
        .from("bingo_cards")
        .select("*, users(name)")
        .eq("game_id", gameId)
        .order("position", { ascending: true, nullsFirst: false });

      if (data) {
        setCards(
          (data as any[]).map((c) => ({
            ...c,
            userName: c.users?.name ?? "—",
          }))
        );
      }
    }

    fetchCards();

    const channel = supabase
      .channel(`admin-cards-${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo_cards", filter: `game_id=eq.${gameId}` },
        () => fetchCards()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId, supabase]);

  const drawnSet = new Set(drawnNumbers);

  if (!cards.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
        Cartelas dos Participantes ({cards.length})
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <MiniCard
            key={card.id}
            card={card}
            drawnSet={drawnSet}
          />
        ))}
      </div>
    </div>
  );
}

function MiniCard({ card, drawnSet }: { card: CardWithUser; drawnSet: Set<number> }) {
  const numbers = card.numbers as number[];
  const isWinner = !!card.position;

  const drawnCount = numbers.filter((n) => drawnSet.has(n)).length;
  const pct = Math.round((drawnCount / 25) * 100);

  return (
    <div className={`rounded-xl overflow-hidden border-2 ${isWinner ? "border-green-400" : "border-gray-200"}`}>
      {/* Header */}
      <div className={`px-2 py-1 flex items-center justify-between ${isWinner ? "bg-green-50" : "bg-gray-50"}`}>
        <span className="text-xs font-semibold text-gray-700 truncate max-w-[5rem]">{card.userName}</span>
        {isWinner ? (
          <span className="text-xs font-bold text-green-700">{card.position}º 🏆</span>
        ) : (
          <span className="text-xs text-gray-400">{pct}%</span>
        )}
      </div>

      {/* 5x5 mini grid */}
      <div className="grid grid-cols-5 gap-px p-1.5 bg-blue-900">
        {numbers.map((n) => {
          const drawn = drawnSet.has(n);
          return (
            <div
              key={n}
              title={String(n)}
              className={`aspect-square flex items-center justify-center rounded-sm text-[9px] font-bold select-none ${
                drawn ? "bg-green-400 text-white" : "bg-white text-gray-500"
              }`}
            >
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
}
