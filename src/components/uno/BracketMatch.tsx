"use client";
import { cn } from "@/lib/utils";
import type { DbUnoBracketMatch, DbUnoDuo, DbUser } from "@/types/database";

interface DuoWithPlayers extends DbUnoDuo {
  player1: DbUser;
  player2: DbUser | null;
}

interface Props {
  match: DbUnoBracketMatch;
  duosMap: Map<string, DuoWithPlayers>;
  onSelectWinner?: (matchId: string, winnerId: string) => void;
  isAdmin?: boolean;
}

export default function BracketMatch({ match, duosMap, onSelectWinner, isAdmin }: Props) {
  const duo1 = match.duo1_id ? duosMap.get(match.duo1_id) : null;
  const duo2 = match.duo2_id ? duosMap.get(match.duo2_id) : null;
  const winner = match.winner_id ? duosMap.get(match.winner_id) : null;
  const hasResult = !!match.winner_id;
  const canSetResult = isAdmin && !hasResult && duo1 && duo2 && !match.is_bye;

  function duoLabel(duo: DuoWithPlayers | null | undefined, isBye?: boolean): string {
    if (isBye) return "BYE";
    if (!duo) return "A definir";
    const p2 = duo.player2 ? duo.player2.name : "🤖 Robo";
    return `${duo.player1.name} & ${p2}`;
  }

  return (
    <div className={cn(
      "bg-white border rounded-xl overflow-hidden shadow-sm w-52 shrink-0",
      hasResult ? "border-gray-200" : "border-blue-200"
    )}>
      {/* Match label */}
      <div className="bg-gray-50 px-3 py-1 text-xs text-gray-400 font-medium border-b border-gray-100">
        {match.bracket_type === "winners" ? "WB" : match.bracket_type === "losers" ? "LB" : "Grand Final"} R{match.round}
        {match.is_bye && " — BYE"}
      </div>

      {/* Duo 1 */}
      <button
        className={cn(
          "w-full text-left px-3 py-2 text-sm border-b border-gray-100 transition-colors",
          canSetResult ? "hover:bg-blue-50 cursor-pointer" : "cursor-default",
          match.winner_id === match.duo1_id ? "bg-green-50 text-green-800 font-semibold" :
          match.winner_id && match.winner_id !== match.duo1_id ? "text-gray-400" : "text-gray-800"
        )}
        onClick={() => canSetResult && match.duo1_id && onSelectWinner?.(match.id, match.duo1_id)}
        disabled={!canSetResult}
      >
        {duoLabel(duo1)}
      </button>

      {/* Duo 2 */}
      <button
        className={cn(
          "w-full text-left px-3 py-2 text-sm transition-colors",
          canSetResult ? "hover:bg-blue-50 cursor-pointer" : "cursor-default",
          match.winner_id === match.duo2_id ? "bg-green-50 text-green-800 font-semibold" :
          match.winner_id && match.winner_id !== match.duo2_id ? "text-gray-400" : "text-gray-800"
        )}
        onClick={() => canSetResult && match.duo2_id && onSelectWinner?.(match.id, match.duo2_id)}
        disabled={!canSetResult}
      >
        {duoLabel(duo2, !match.duo2_id && match.is_bye)}
      </button>
    </div>
  );
}
