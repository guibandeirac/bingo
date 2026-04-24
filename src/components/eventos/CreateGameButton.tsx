"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BingoGameMode } from "@/types/database";

interface Props {
  eventId: string;
  type: "bingo" | "uno";
}

const MODE_OPTIONS: { value: BingoGameMode; label: string; hint: string }[] = [
  { value: "full", label: "Cartela cheia", hint: "Marcar as 25 casas" },
  { value: "border", label: "Extremidades", hint: "Marcar as 16 casas das bordas" },
  { value: "x", label: "X", hint: "Marcar as 9 casas das diagonais" },
];

export default function CreateGameButton({ eventId, type }: Props) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<BingoGameMode>("full");
  const router = useRouter();

  async function create() {
    setLoading(true);
    const body: Record<string, unknown> = { eventId };
    if (type === "bingo") body.gameMode = mode;
    await fetch(`/api/${type}/criar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
    setLoading(false);
    setOpen(false);
  }

  if (type === "uno") {
    return (
      <button
        onClick={create}
        disabled={loading}
        className="mt-2 w-full bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
      >
        {loading ? "Criando..." : "Criar Torneio Uno"}
      </button>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors"
      >
        Criar Jogo de Bingo
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Modo de jogo</p>
      <div className="space-y-2">
        {MODE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
              mode === opt.value
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="bingo-mode"
              value={opt.value}
              checked={mode === opt.value}
              onChange={() => setMode(opt.value)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.hint}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          onClick={create}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar"}
        </button>
      </div>
    </div>
  );
}
