"use client";
import type { DbUser } from "@/types/database";

interface Props {
  seed: number;
  player1: DbUser;
  player2: DbUser | null; // null = Robo
}

export default function DuoCard({ seed, player1, player2 }: Props) {
  const isRobo = !player2;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <span className="text-lg font-bold text-gray-400 w-8 text-center">#{seed}</span>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{player1.name}</p>
        <p className="text-sm text-gray-500">
          &amp;{" "}
          {isRobo ? (
            <span className="text-purple-600 font-medium">🤖 Robo</span>
          ) : (
            player2.name
          )}
        </p>
      </div>
      {isRobo && (
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          Robo
        </span>
      )}
    </div>
  );
}
