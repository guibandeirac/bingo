"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbUnoBracketMatch, DbUnoDuo, DbUnoTournament } from "@/types/database";

export function useBracketRealtime(tournamentId: string) {
  const supabase = getSupabaseBrowserClient();
  const [tournament, setTournament] = useState<DbUnoTournament | null>(null);
  const [matches, setMatches] = useState<DbUnoBracketMatch[]>([]);
  const [duos, setDuos] = useState<DbUnoDuo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialState = useCallback(async () => {
    const [tRes, mRes, dRes] = await Promise.all([
      supabase.from("uno_tournaments").select("*").eq("id", tournamentId).single(),
      supabase.from("uno_bracket_matches").select("*").eq("tournament_id", tournamentId).order("bracket_type").order("round").order("match_number"),
      supabase.from("uno_duos").select("*").eq("tournament_id", tournamentId).order("seed"),
    ]);
    if (tRes.data) setTournament(tRes.data);
    if (mRes.data) setMatches(mRes.data);
    if (dRes.data) setDuos(dRes.data);
    setLoading(false);
  }, [tournamentId, supabase]);

  useEffect(() => {
    fetchInitialState();

    const channel = supabase
      .channel(`bracket-${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "uno_bracket_matches", filter: `tournament_id=eq.${tournamentId}` },
        (payload) => {
          setMatches((prev) =>
            prev.map((m) => m.id === (payload.new as any).id ? { ...m, ...(payload.new as any) } : m)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "uno_tournaments", filter: `id=eq.${tournamentId}` },
        (payload) => { setTournament((prev) => prev ? { ...prev, ...(payload.new as any) } : prev); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tournamentId, supabase, fetchInitialState]);

  return { tournament, matches, duos, loading };
}
