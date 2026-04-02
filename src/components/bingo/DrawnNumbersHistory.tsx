"use client";

interface Props {
  drawnNumbers: number[];
}

export default function DrawnNumbersHistory({ drawnNumbers }: Props) {
  const drawnSet = new Set(drawnNumbers);

  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Números sorteados</p>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`aspect-square flex items-center justify-center text-xs font-semibold rounded ${
              drawnSet.has(n)
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}
