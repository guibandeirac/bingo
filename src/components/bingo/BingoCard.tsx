"use client";
import BingoCell from "./BingoCell";
import type { CellState } from "@/types/database";

interface Props {
  numbers: number[];
  markedNumbers: number[];
  drawnNumbers: number[];
  onMark: (n: number) => void;
}

export default function BingoCard({ numbers, markedNumbers, drawnNumbers, onMark }: Props) {
  const markedSet = new Set(markedNumbers);
  const drawnSet = new Set(drawnNumbers);

  function getCellState(n: number): CellState {
    if (markedSet.has(n) && drawnSet.has(n)) return "green";
    if (drawnSet.has(n) && !markedSet.has(n)) return "yellow";
    return "white";
  }

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-4 bg-blue-900 rounded-2xl shadow-xl">
      {numbers.map((n) => (
        <BingoCell
          key={n}
          number={n}
          state={getCellState(n)}
          onClick={() => onMark(n)}
        />
      ))}
    </div>
  );
}
