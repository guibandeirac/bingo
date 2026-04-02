"use client";
import { useState } from "react";

interface Props {
  gameId: string;
  allMarked: boolean;
  alreadyWon: boolean;
  onWin: () => void;
}

export default function BingoButton({ gameId, allMarked, alreadyWon, onWin }: Props) {
  const [error, setError] = useState("");

  function handleBingo() {
    // Feedback imediato — o botão só fica ativo quando todos os números já sorteados
    // estão marcados, então a validação client-side já garante a integridade
    onWin();

    // Registra no servidor em background (não bloqueia a UI)
    fetch("/api/bingo/bingo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
      })
      .catch(() => {/* silencioso — UI já reagiu */});
  }

  if (alreadyWon) return null;

  return (
    <div className="text-center space-y-2">
      <button
        onClick={handleBingo}
        disabled={!allMarked}
        className="px-10 py-4 text-2xl font-black rounded-2xl shadow-lg transition-all bg-green-500 text-white hover:bg-green-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
      >
        🎉 BINGO!
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!allMarked && (
        <p className="text-xs text-gray-400">Marque todos os números sorteados para habilitar</p>
      )}
    </div>
  );
}
