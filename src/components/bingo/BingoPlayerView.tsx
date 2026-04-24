"use client";
import { useState } from "react";
import { useBingoRealtime } from "@/hooks/useBingoRealtime";
import BingoCard from "./BingoCard";
import NumberDisplay from "./NumberDisplay";
import DrawnNumbersHistory from "./DrawnNumbersHistory";
import BingoTierlist from "./BingoTierlist";
import BingoButton from "./BingoButton";
import { canClaimBingo } from "@/lib/bingo/validator";
import { GAME_MODE_LABELS, getRequiredIndices } from "@/lib/bingo/modes";
import type { DbBingoCard, DbBingoGame, BingoGameMode } from "@/types/database";

interface Props {
  gameId: string;
  userId: string;
  userName: string;
  initialCard: DbBingoCard | null;
  initialGameStatus: DbBingoGame["status"];
  initialGameMode: BingoGameMode;
}

export default function BingoPlayerView({
  gameId,
  userId,
  userName,
  initialCard,
  initialGameStatus,
  initialGameMode,
}: Props) {
  const { drawnNumbers, gameStatus, myCard, winners, loading, markNumber, addWinner } = useBingoRealtime(gameId, userId);
  const [wonPosition, setWonPosition] = useState<number | null>(null);
  const [didComplete, setDidComplete] = useState(false);

  const card = myCard ?? initialCard;
  const status = gameStatus ?? initialGameStatus;
  const mode = initialGameMode;
  const currentNumber = drawnNumbers[drawnNumbers.length - 1] ?? null;

  const cardNumbers = (card?.numbers ?? []) as number[];
  const markedNumbers = (card?.marked_numbers ?? []) as number[];
  const requiredCount = getRequiredIndices(mode).length;
  const canClaim = cardNumbers.length === 25 && canClaimBingo(cardNumbers, markedNumbers, mode);
  const canClaimBingoNow = canClaim && status === "in_progress";

  const confirmedPosition = card?.position ?? wonPosition;
  // Considera "já completou" tanto quem ganhou posição quanto quem clicou após o top 5
  const alreadyWon = didComplete || !!card?.completed_at || confirmedPosition !== null;

  function handleWin(position: number | null, completedAt: string) {
    setWonPosition(position);
    setDidComplete(true);
    addWinner({ user_id: userId, name: userName, position, completed_at: completedAt });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Carregando...
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-4xl mb-4">⏳</p>
        <p className="text-lg font-medium">Aguardando o jogo iniciar...</p>
        <p className="text-sm mt-2">O admin vai gerar as cartelas em breve.</p>
      </div>
    );
  }

  if (status === "cards_generated" && !card) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-4xl mb-4">🎴</p>
        <p className="text-lg font-medium">Cartelas geradas!</p>
        <p className="text-sm mt-2">Aguarde o início do sorteio.</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Você não tem uma cartela neste jogo.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">🎰 Bingo</h1>
        <p className="text-xs text-gray-500 mt-1">
          Modo: <span className="font-semibold text-blue-700">{GAME_MODE_LABELS[mode]}</span>
          {" · "}Marque {requiredCount} casa{requiredCount > 1 ? "s" : ""}
        </p>
      </div>

      {status === "in_progress" && (
        <NumberDisplay currentNumber={currentNumber} totalDrawn={drawnNumbers.length} />
      )}

      {status === "finished" && (
        <div className="text-center bg-gray-100 text-gray-600 rounded-xl p-4 font-medium">
          Jogo encerrado
        </div>
      )}

      {/* Resultado do clique no BINGO */}
      {alreadyWon && (
        <div className={`text-center rounded-xl p-4 font-bold text-lg ${
          confirmedPosition !== null
            ? "bg-green-100 text-green-800"
            : "bg-blue-50 text-blue-700"
        }`}>
          {confirmedPosition !== null
            ? `🎉 Parabéns! Você completou em ${confirmedPosition}º lugar!`
            : "✅ Você completou o bingo! O top 5 já havia sido preenchido."}
        </div>
      )}

      <BingoCard
        numbers={cardNumbers}
        markedNumbers={markedNumbers}
        drawnNumbers={drawnNumbers}
        mode={mode}
        onMark={markNumber}
      />

      <BingoButton
        gameId={gameId}
        allMarked={canClaimBingoNow}
        alreadyWon={alreadyWon}
        onWin={handleWin}
      />

      <BingoTierlist winners={winners} />

      <DrawnNumbersHistory drawnNumbers={drawnNumbers} />
    </div>
  );
}
