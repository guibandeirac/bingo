"use client";
import BracketMatch from "./BracketMatch";
import type { DbUnoBracketMatch, DbUnoDuo, DbUser } from "@/types/database";

interface DuoWithPlayers extends DbUnoDuo {
  player1: DbUser;
  player2: DbUser | null;
}

interface Props {
  matches: DbUnoBracketMatch[];
  duos: DuoWithPlayers[];
  isAdmin?: boolean;
  onSelectWinner?: (matchId: string, winnerId: string) => void;
}

type BracketSection = "winners" | "losers" | "grand_final";

function groupByRound(matches: DbUnoBracketMatch[]): Map<number, DbUnoBracketMatch[]> {
  const map = new Map<number, DbUnoBracketMatch[]>();
  for (const m of matches) {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round)!.push(m);
  }
  return map;
}

export default function BracketView({ matches, duos, isAdmin, onSelectWinner }: Props) {
  const duosMap = new Map<string, DuoWithPlayers>(duos.map((d) => [d.id, d]));

  const sections: BracketSection[] = ["winners", "losers", "grand_final"];
  const sectionLabels: Record<BracketSection, string> = {
    winners: "Winners Bracket",
    losers: "Losers Bracket",
    grand_final: "Grand Final",
  };

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const sectionMatches = matches.filter((m) => m.bracket_type === section);
        if (!sectionMatches.length) return null;

        const byRound = groupByRound(sectionMatches);
        const rounds = Array.from(byRound.keys()).sort((a, b) => a - b);

        return (
          <div key={section}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
              {sectionLabels[section]}
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4" style={{ minWidth: `${rounds.length * 220}px` }}>
                {rounds.map((round) => (
                  <div key={round} className="flex flex-col gap-4 shrink-0">
                    <p className="text-xs text-gray-400 text-center font-medium">Rodada {round}</p>
                    {byRound.get(round)!.map((match) => (
                      <BracketMatch
                        key={match.id}
                        match={match}
                        duosMap={duosMap}
                        isAdmin={isAdmin}
                        onSelectWinner={onSelectWinner}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
