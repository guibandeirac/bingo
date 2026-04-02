"use client";
import { useEffect, useState, useCallback } from "react";
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
  eventId: string;
  tournamentId: string;
}

export default function UnoAdminView({ tournamentId }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { tournament, matches, duos, loading } = useBracketRealtime(tournamentId);
  const [duosWithPlayers, setDuosWithPlayers] = useState<DuoWithPlayers[]>([]);
  const [finals, setFinals] = useState<DbUnoIndividualFinal[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, DbUser>>(new Map());
  const [actionLoading, setActionLoading] = useState(false);
  const [hasRobo, setHasRobo] = useState(false);

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

  const fetchFinals = useCallback(async () => {
    const { data } = await supabase.from("uno_individual_finals").select("*").eq("tournament_id", tournamentId);
    if (data) setFinals(data);
  }, [tournamentId, supabase]);

  useEffect(() => { fetchFinals(); }, [fetchFinals]);

  async function postJson(url: string, body: object) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  async function handleGerarDuplas() {
    setActionLoading(true);
    const res = await postJson("/api/uno/gerar-duplas", { tournamentId });
    const data = await res.json();
    setHasRobo(!!data.hasRobo);
    setActionLoading(false);
  }

  async function handleGerarBracket() {
    setActionLoading(true);
    await postJson("/api/uno/gerar-bracket", { tournamentId });
    setActionLoading(false);
  }

  async function handleSelectWinner(matchId: string, winnerId: string) {
    await postJson("/api/uno/registrar-resultado", { matchId, winnerId });
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Carregando...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">🃏 Torneio Uno — Admin</h1>
        <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium">
          {tournament?.status ?? "—"}
        </span>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Ações</h2>

        {hasRobo && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800 flex items-center gap-2">
            🤖 Número ímpar de participantes — um jogador foi emparelhado com o <strong>Robo</strong>.
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGerarDuplas}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            🔀 {tournament?.status === "duos_generated" || tournament?.status === "bracket_generated" ? "Re-sortear Duplas" : "Gerar Duplas"}
          </button>

          {(tournament?.status === "duos_generated" || tournament?.status === "bracket_generated") && (
            <button
              onClick={handleGerarBracket}
              disabled={actionLoading || !duos.length}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              🏆 {tournament?.status === "bracket_generated" ? "Re-gerar Bracket" : "Gerar Bracket"}
            </button>
          )}
        </div>
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
          isAdmin={true}
          onSelectWinner={handleSelectWinner}
        />
      )}

      {/* Finais individuais */}
      <IndividualFinals
        finals={finals}
        usersMap={usersMap}
        isAdmin={true}
        onUpdate={fetchFinals}
      />
    </div>
  );
}
