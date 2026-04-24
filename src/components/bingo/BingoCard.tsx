"use client";
import BingoCell from "./BingoCell";
import type { CellState, BingoGameMode } from "@/types/database";
import { getRequiredIndices } from "@/lib/bingo/modes";

interface Props {
  numbers: number[];
  markedNumbers: number[];
  drawnNumbers: number[];
  mode: BingoGameMode;
  onMark: (n: number) => void;
}

export default function BingoCard({ numbers, markedNumbers, drawnNumbers, mode, onMark }: Props) {
  const markedSet = new Set(markedNumbers);
  const drawnSet = new Set(drawnNumbers);
  const requiredIndices = new Set(getRequiredIndices(mode));

  function getCellState(n: number, index: number): CellState {
    if (!requiredIndices.has(index)) return "locked";
    if (markedSet.has(n) && drawnSet.has(n)) return "green";
    if (drawnSet.has(n) && !markedSet.has(n)) return "yellow";
    return "white";
  }

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-4 bg-blue-900 rounded-2xl shadow-xl">
      {numbers.map((n, index) => (
        <BingoCell
          key={n}
          number={n}
          state={getCellState(n, index)}
          onClick={() => onMark(n)}
        />
      ))}
    </div>
  );
}
