"use client";

interface Props {
  currentNumber: number | null;
  totalDrawn: number;
}

export default function NumberDisplay({ currentNumber, totalDrawn }: Props) {
  return (
    <div className="text-center">
      <div className="inline-flex flex-col items-center bg-white rounded-2xl shadow-xl px-10 py-6 border-4 border-blue-600">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Número atual</p>
        <div className="text-7xl font-black text-blue-700 leading-none min-w-[3.5rem]">
          {currentNumber ?? "—"}
        </div>
        <p className="text-sm text-gray-500 mt-2">{totalDrawn} / 90 sorteados</p>
      </div>
    </div>
  );
}
