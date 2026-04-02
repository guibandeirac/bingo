import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { matchId, winnerId } = await req.json();
  const userClient = await getSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await userClient.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const admin = getSupabaseAdminClient();
  const { data: match } = await admin
    .from("uno_bracket_matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });

  const loserId = match.duo1_id === winnerId ? match.duo2_id : match.duo1_id;

  // Set winner
  await admin.from("uno_bracket_matches").update({ winner_id: winnerId }).eq("id", matchId);

  // Advance winner to next match
  if (match.next_winner_match_id) {
    const { data: nextWinner } = await admin.from("uno_bracket_matches").select("duo1_id, duo2_id").eq("id", match.next_winner_match_id).single();
    if (nextWinner) {
      const update = nextWinner.duo1_id === null ? { duo1_id: winnerId } : { duo2_id: winnerId };
      await admin.from("uno_bracket_matches").update(update).eq("id", match.next_winner_match_id);
    }
  }

  // Send loser to losers bracket
  if (match.next_loser_match_id && loserId) {
    const { data: nextLoser } = await admin.from("uno_bracket_matches").select("duo1_id, duo2_id").eq("id", match.next_loser_match_id).single();
    if (nextLoser) {
      const update = nextLoser.duo1_id === null ? { duo1_id: loserId } : { duo2_id: loserId };
      await admin.from("uno_bracket_matches").update(update).eq("id", match.next_loser_match_id);
    }
  }

  return NextResponse.json({ ok: true });
}
