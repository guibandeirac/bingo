import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { generateUniqueCards } from "@/lib/bingo/card-generator";

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const userClient = await getSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await userClient.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const admin = getSupabaseAdminClient();

  // Get participants via event
  const { data: game } = await admin.from("bingo_games").select("event_id, status").eq("id", gameId).single();
  if (!game) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
  if (game.status !== "waiting") return NextResponse.json({ error: "Cartelas já geradas" }, { status: 400 });

  const { data: participants } = await admin
    .from("event_participants")
    .select("user_id")
    .eq("event_id", game.event_id);

  if (!participants?.length) return NextResponse.json({ error: "Sem participantes" }, { status: 400 });

  const cards = generateUniqueCards(participants.length);
  const inserts = participants.map((p, i) => ({
    game_id: gameId,
    user_id: p.user_id,
    numbers: cards[i],
    marked_numbers: [],
  }));

  const { error: insertError } = await admin.from("bingo_cards").insert(inserts as any);
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await admin.from("bingo_games").update({ status: "cards_generated" }).eq("id", gameId);
  return NextResponse.json({ count: inserts.length });
}
