"use client";
import { useState } from "react";

interface Props {
  gameId: string;
  allMarked: boolean;
  alreadyWon: boolean;
  onWin: (position: number | null, completedAt: string) => void;
}

export default function BingoButton({ gameId, allMarked, alreadyWon, onWin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleBingo() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bingo/bingo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        onWin(data.position ?? null, data.completed_at);
      }
    } catch {
      setError("Erro ao registrar BINGO. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (alreadyWon) return null;

  return (
    <div className="text-center space-y-2">
      <button
        onClick={handleBingo}
        disabled={!allMarked || loading}
        className="px-10 py-4 text-2xl font-black rounded-2xl shadow-lg transition-all bg-green-500 text-white hover:bg-green-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {loading ? "Registrando..." : "🎉 BINGO!"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!allMarked && !loading && (
        <p className="text-xs text-gray-400">Marque todos os números sorteados para habilitar</p>
      )}
    </div>
  );
}
