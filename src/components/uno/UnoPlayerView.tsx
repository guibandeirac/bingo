"use client";
import { useEffect, useState } from "react";
import { useBracketRealtime } from "@/hooks/useBracketRealtime";
import BracketView from "./BracketView";
import DuoCard from "./DuoCard";
import IndividualFinals from "./IndividualFinals";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbUnoDuo, DbUser, DbUnoIndividualFinal } from "@/types/database";

interface DuoWithPlayers extends DbUnoDuo {
  player1: DbUser;
  player2: DbUser | null;
}

interface Props {
  tournamentId: string;
}

export default function UnoPlayerView({ tournamentId }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { tournament, matches, duos, loading } = useBracketRealtime(tournamentId);
  const [duosWithPlayers, setDuosWithPlayers] = useState<DuoWithPlayers[]>([]);
  const [finals, setFinals] = useState<DbUnoIndividualFinal[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, DbUser>>(new Map());

  useEffect(() => {
    if (!duos.length) return;
    const userIds = [...new Set(duos.flatMap((d) => [d.player1_id, d.player2_id]).filter(Boolean))];
    supabase.from("users").select("*").in("id", userIds).then(({ data }) => {
      const map = new Map<string, DbUser>((data ?? []).map((u: any) => [u.id, u]));
      setUsersMap(map);
      setDuosWithPlayers(
        duos
          .filter((d) => map.has(d.player1_id))
          .map((d) => ({
            ...d,
            player1: map.get(d.player1_id)!,
            player2: d.player2_id ? (map.get(d.player2_id) ?? null) : null,
          }))
      );
    });
  }, [duos, supabase]);

  useEffect(() => {
    supabase.from("uno_individual_finals").select("*").eq("tournament_id", tournamentId).then(({ data }) => {
      if (data) setFinals(data);
    });
  }, [tournamentId, supabase]);

  if (loading) return <div className="text-center py-20 text-gray-400">Carregando...</div>;

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    duos_generated: "Duplas geradas",
    bracket_generated: "Bracket gerado",
    in_progress: "Em andamento",
    finals: "Finais",
    finished: "Finalizado",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">🃏 Torneio Uno</h1>
        {tournament && (
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
            {statusLabels[tournament.status] ?? tournament.status}
          </span>
        )}
      </div>

      {/* Duplas */}
      {duosWithPlayers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Duplas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {duosWithPlayers.map((d) => (
              <DuoCard key={d.id} seed={d.seed} player1={d.player1} player2={d.player2} />
            ))}
          </div>
        </div>
      )}

      {/* Bracket */}
      {matches.length > 0 && (
        <BracketView
          matches={matches}
          duos={duosWithPlayers}
          isAdmin={false}
        />
      )}

      {/* Finais */}
      <IndividualFinals finals={finals} usersMap={usersMap} isAdmin={false} />
    </div>
  );
}
