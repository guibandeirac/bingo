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
      aria-label={`Número ${number} — ${state === "white" ? "não sorteado" : state === "yellow" ? "clique para marcar" : "marcado"}`}
    >
      {number}
    </button>
  );
}
