"use client";
import type { RankingEntry } from "@/types/database";

const MEDALS = ["🥇", "🥈", "🥉"];

interface Props {
  ranking: RankingEntry[];
}

export default function RankingTable({ ranking }: Props) {
  if (!ranking.length) {
    return <p className="text-gray-400 text-sm">Nenhuma pontuação registrada neste mês.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-3 text-gray-400 font-medium w-12">#</th>
            <th className="pb-3 text-gray-400 font-medium">Jogador</th>
            <th className="pb-3 text-gray-400 font-medium text-right">Vitórias</th>
            <th className="pb-3 text-gray-400 font-medium text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry, i) => (
            <tr
              key={entry.user_id}
              className={`border-b border-gray-100 last:border-0 ${i === 0 ? "bg-yellow-50" : ""}`}
            >
              <td className="py-3 text-lg">
                {MEDALS[i] ?? <span className="text-gray-400 font-semibold">{i + 1}</span>}
              </td>
              <td className="py-3 font-medium text-gray-900">{entry.name}</td>
              <td className="py-3 text-right text-gray-500">{entry.wins}x</td>
              <td className="py-3 text-right font-bold text-blue-700">{entry.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
