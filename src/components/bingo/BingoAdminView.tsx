"use client";
import { useBingoRealtime } from "@/hooks/useBingoRealtime";
import AdminBingoPanel from "./AdminBingoPanel";
import AdminMiniCards from "./AdminMiniCards";
import NumberDisplay from "./NumberDisplay";
import DrawnNumbersHistory from "./DrawnNumbersHistory";
import BingoTierlist from "./BingoTierlist";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import type { DbBingoGame, BingoGameMode } from "@/types/database";
import { GAME_MODE_LABELS } from "@/lib/bingo/modes";

interface Props {
  eventId: string;
  gameId: string;
}

export default function BingoAdminView({ gameId }: Props) {
  const supabase = getSupabaseBrowserClient();
  const [game, setGame] = useState<DbBingoGame | null>(null);
  const userId = "admin";
  const { drawnNumbers, gameStatus, winners, loading } = useBingoRealtime(gameId, userId);

  useEffect(() => {
    supabase.from("bingo_games").select("*").eq("id", gameId).single().then(({ data }) => {
      if (data) setGame(data);
    });
  }, [gameId, supabase, gameStatus]);

  const currentNumber = drawnNumbers[drawnNumbers.length - 1] ?? null;
  const showCards = gameStatus === "cards_generated" || gameStatus === "in_progress" || gameStatus === "finished";

  if (loading || !game) return <div className="text-center py-20 text-gray-400">Carregando...</div>;

  const mode: BingoGameMode = ((game as any).game_mode ?? "full") as BingoGameMode;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">🎰 Bingo — Painel Admin</h1>
        <p className="text-xs text-gray-500 mt-1">
          Modo: <span className="font-semibold text-blue-700">{GAME_MODE_LABELS[mode]}</span>
        </p>
      </div>

      <AdminBingoPanel
        game={game}
        drawnNumbers={drawnNumbers}
        onDraw={() => {}}
      />

      {(gameStatus === "in_progress" || gameStatus === "finished") && (
        <NumberDisplay currentNumber={currentNumber} totalDrawn={drawnNumbers.length} />
      )}

      <BingoTierlist winners={winners} />

      {/* Mini cards — visible once cards are generated */}
      {showCards && (
        <AdminMiniCards gameId={gameId} drawnNumbers={drawnNumbers} mode={mode} />
      )}

      <DrawnNumbersHistory drawnNumbers={drawnNumbers} />
    </div>
  );
}
