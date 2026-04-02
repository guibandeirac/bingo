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
  initialCard: DbBingoCard | null;
  initialGameStatus: DbBingoGame["status"];
}

export default function BingoPlayerView({ gameId, userId, initialCard, initialGameStatus }: Props) {
  const { drawnNumbers, gameStatus, myCard, winners, loading, markNumber } = useBingoRealtime(gameId, userId);
  const [won, setWon] = useState(false);

  const card = myCard ?? initialCard;
  const status = gameStatus ?? initialGameStatus;
  const currentNumber = drawnNumbers[drawnNumbers.length - 1] ?? null;

  const markedCount = (card?.marked_numbers?.length ?? 0);
  const allMarked = markedCount === 25;
  const alreadyWon = won || !!card?.position;

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

      {/* Current number */}
      {status === "in_progress" && (
        <NumberDisplay currentNumber={currentNumber} totalDrawn={drawnNumbers.length} />
      )}

      {/* Status banner */}
      {status === "finished" && (
        <div className="text-center bg-gray-100 text-gray-600 rounded-xl p-4 font-medium">
          Jogo encerrado
        </div>
      )}

      {/* Winner celebration */}
      {alreadyWon && (
        <div className="text-center bg-green-100 text-green-800 rounded-xl p-4 font-bold text-lg">
          🎉 Parabéns! Você completou em {card.position}º lugar!
        </div>
      )}

      {/* My bingo card */}
      <BingoCard
        numbers={card.numbers as number[]}
        markedNumbers={card.marked_numbers as number[]}
        drawnNumbers={drawnNumbers}
        onMark={markNumber}
      />

      {/* Bingo button */}
      {status === "in_progress" && (
        <BingoButton
          gameId={gameId}
          allMarked={allMarked}
          alreadyWon={alreadyWon}
          onWin={setWon.bind(null, true)}
        />
      )}

      {/* Tierlist */}
      <BingoTierlist winners={winners} />

      {/* Drawn numbers history */}
      <DrawnNumbersHistory drawnNumbers={drawnNumbers} />
    </div>
  );
}
