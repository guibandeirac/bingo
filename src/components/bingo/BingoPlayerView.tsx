"use client";
import { useState } from "react";
import { useBingoRealtime } from "@/hooks/useBingoRealtime";
import BingoCard from "./BingoCard";
import NumberDisplay from "./NumberDisplay";
import DrawnNumbersHistory from "./DrawnNumbersHistory";
import BingoTierlist from "./BingoTierlist";
import BingoButton from "./BingoButton";
import type { DbBingoCard, DbBingoGame } from "@/types/database";

interface Props {
  gameId: string;
  userId: string;
  userName: string;
  initialCard: DbBingoCard | null;
  initialGameStatus: DbBingoGame["status"];
}

export default function BingoPlayerView({ gameId, userId, userName, initialCard, initialGameStatus }: Props) {
  const { drawnNumbers, gameStatus, myCard, winners, loading, markNumber, addWinner } = useBingoRealtime(gameId, userId);
  const [wonPosition, setWonPosition] = useState<number | null>(null);
  const [didComplete, setDidComplete] = useState(false);

  const card = myCard ?? initialCard;
  const status = gameStatus ?? initialGameStatus;
  const currentNumber = drawnNumbers[drawnNumbers.length - 1] ?? null;

  const markedCount = (card?.marked_numbers?.length ?? 0);
  const allMarked = markedCount === 25;
  const canClaimBingo = allMarked && status === "in_progress";

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
      <h1 className="text-xl font-bold text-center text-gray-900">🎰 Bingo</h1>

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
        numbers={card.numbers as number[]}
        markedNumbers={card.marked_numbers as number[]}
        drawnNumbers={drawnNumbers}
        onMark={markNumber}
      />

      <BingoButton
        gameId={gameId}
        allMarked={canClaimBingo}
        alreadyWon={alreadyWon}
        onWin={handleWin}
      />

      <BingoTierlist winners={winners} />

      <DrawnNumbersHistory drawnNumbers={drawnNumbers} />
    </div>
  );
}
