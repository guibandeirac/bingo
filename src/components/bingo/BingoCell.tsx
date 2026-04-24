"use client";
import { cn } from "@/lib/utils";
import type { CellState } from "@/types/database";

interface Props {
  number: number;
  state: CellState;
  onClick?: () => void;
}

const STATE_STYLES: Record<CellState, string> = {
  white: "bg-white text-gray-400 border-gray-200 cursor-default",
  yellow: "bg-yellow-300 text-yellow-900 border-yellow-400 cursor-pointer hover:bg-yellow-400 transition-colors",
  green: "bg-green-400 text-white border-green-500 cursor-default",
  locked: "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60",
};

const ARIA_LABEL: Record<CellState, string> = {
  white: "não sorteado",
  yellow: "clique para marcar",
  green: "marcado",
  locked: "fora do padrão deste modo de jogo",
};

export default function BingoCell({ number, state, onClick }: Props) {
  return (
    <button
      className={cn(
        "w-full aspect-square flex items-center justify-center rounded-lg border-2 font-bold text-sm sm:text-base select-none transition-all",
        STATE_STYLES[state],
        state === "yellow" && "scale-105 shadow-md"
      )}
      onClick={state === "yellow" ? onClick : undefined}
      disabled={state !== "yellow"}
      aria-label={`Número ${number} — ${ARIA_LABEL[state]}`}
    >
      {number}
    </button>
  );
}
