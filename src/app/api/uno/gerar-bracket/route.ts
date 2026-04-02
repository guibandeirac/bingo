import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { buildDoubleElimBracket } from "@/lib/uno/bracket-builder";

export async function POST(req: NextRequest) {
  const { tournamentId } = await req.json();
  const userClient = await getSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await userClient.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const admin = getSupabaseAdminClient();
  const { data: duos } = await admin.from("uno_duos").select("*").eq("tournament_id", tournamentId).order("seed");

  if (!duos?.length) return NextResponse.json({ error: "Gere as duplas primeiro" }, { status: 400 });

  const matchSeeds = buildDoubleElimBracket(tournamentId, duos);

  // Delete old matches
  await admin.from("uno_bracket_matches").delete().eq("tournament_id", tournamentId);

  // Insert without cross-references first
  const baseInserts = matchSeeds.map((m) => ({
    tournament_id: m.tournament_id,
    bracket_type: m.bracket_type,
    round: m.round,
    match_number: m.match_number,
    duo1_id: m.duo1_id,
    duo2_id: m.duo2_id,
    winner_id: m.winner_id,
    is_bye: m.is_bye,
    next_winner_match_id: null,
    next_loser_match_id: null,
  }));

  const { data: inserted, error } = await admin
    .from("uno_bracket_matches")
    .insert(baseInserts)
    .select("id, match_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build match_number → id map
  const matchMap = new Map<number, string>();
  for (const m of inserted ?? []) {
    matchMap.set(m.match_number, m.id);
  }

  // Second pass: resolve next_winner_match_id and next_loser_match_id
  const updates = matchSeeds
    .filter((m) => m.next_winner_match_ref !== null || m.next_loser_match_ref !== null)
    .map((m) => ({
      id: matchMap.get(m.match_number)!,
      next_winner_match_id: m.next_winner_match_ref ? matchMap.get(m.next_winner_match_ref) ?? null : null,
      next_loser_match_id: m.next_loser_match_ref ? matchMap.get(m.next_loser_match_ref) ?? null : null,
    }));

  for (const u of updates) {
    await admin
      .from("uno_bracket_matches")
      .update({ next_winner_match_id: u.next_winner_match_id, next_loser_match_id: u.next_loser_match_id })
      .eq("id", u.id);
  }

  await admin.from("uno_tournaments").update({ status: "bracket_generated" }).eq("id", tournamentId);
  return NextResponse.json({ matches: matchSeeds.length });
}
