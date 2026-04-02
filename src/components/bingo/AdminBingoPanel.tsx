"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { DbBingoGame } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  game: DbBingoGame;
  drawnNumbers: number[];
  onDraw: () => void;
}

export default function AdminBingoPanel({ game, drawnNumbers, onDraw }: Props) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [autoActive, setAutoActive] = useState(game.auto_mode);
  const [intervalSec, setIntervalSec] = useState(game.auto_interval_seconds ?? 10);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drawRef = useRef<(() => Promise<void>) | null>(null);

  async function postJson(url: string, body: object) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function handleGerarCartelas() {
    setLoading(true);
    await postJson("/api/bingo/gerar-cartelas", { gameId: game.id });
    router.refresh();
    setLoading(false);
  }

  async function handleIniciar() {
    setLoading(true);
    await postJson("/api/bingo/iniciar", { gameId: game.id });
    router.refresh();
    setLoading(false);
  }

  const handleSortear = useCallback(async () => {
    await postJson("/api/bingo/sortear", { gameId: game.id });
    onDraw();
  }, [game.id, onDraw]);

  // Keep drawRef in sync so the interval closure always calls the latest version
  useEffect(() => {
    drawRef.current = handleSortear;
  }, [handleSortear]);

  async function handleEncerrar() {
    stopAuto();
    await supabase.from("bingo_games").update({ status: "finished" }).eq("id", game.id);
    router.refresh();
  }

  function stopAuto() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(0);
    setAutoActive(false);
  }

  function startAuto(sec: number) {
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Draw immediately on start, then set countdown
    drawRef.current?.();
    setCountdown(sec);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          drawRef.current?.();
          return sec;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function toggleAuto() {
    const next = !autoActive;
    setAutoActive(next);
    await supabase
      .from("bingo_games")
      .update({ auto_mode: next, auto_interval_seconds: intervalSec })
      .eq("id", game.id);

    if (next) {
      startAuto(intervalSec);
    } else {
      stopAuto();
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // If game finishes, stop auto
  useEffect(() => {
    if (game.status === "finished") stopAuto();
  }, [game.status]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Painel Admin — Bingo</h2>

      <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500">
        <span>Status: <strong>{game.status}</strong></span>
        <span>Sorteados: <strong>{drawnNumbers.length}/90</strong></span>
      </div>

      {game.status === "waiting" && (
        <button
          onClick={handleGerarCartelas}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Gerando..." : "Gerar Cartelas"}
        </button>
      )}

      {game.status === "cards_generated" && (
        <button
          onClick={handleIniciar}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Iniciando..." : "▶ Iniciar Jogo"}
        </button>
      )}

      {game.status === "in_progress" && (
        <div className="space-y-3">
          {/* Manual draw */}
          <button
            onClick={handleSortear}
            disabled={autoActive}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            🎲 Sortear Número
          </button>

          {/* Auto mode */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Modo Automático</span>
              {autoActive && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Próximo em</span>
                  <span className="text-xl font-black text-blue-600 w-8 text-center tabular-nums">
                    {countdown}s
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 shrink-0">Intervalo (s):</label>
              <input
                type="number"
                min={1}
                max={300}
                value={intervalSec}
                onChange={(e) => setIntervalSec(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={autoActive}
                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center font-mono disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={toggleAuto}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  autoActive
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {autoActive ? "⏹ Parar" : "⚡ Iniciar Auto"}
              </button>
            </div>

            {/* Countdown bar */}
            {autoActive && (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / intervalSec) * 100}%` }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleEncerrar}
            className="w-full border border-red-300 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Encerrar Jogo
          </button>
        </div>
      )}

      {game.status === "finished" && (
        <p className="text-center text-gray-400 text-sm">Jogo encerrado.</p>
      )}
    </div>
  );
}
