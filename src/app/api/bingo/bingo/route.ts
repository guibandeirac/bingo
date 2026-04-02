import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { validateBingoClaim } from "@/lib/bingo/validator";

const POINTS_MAP: Record<number, number> = { 1: 30, 2: 25, 3: 20, 4: 15, 5: 10 };

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const userClient = await getSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = getSupabaseAdminClient();

  const [{ data: card }, { data: drawn }, { data: game }] = await Promise.all([
    admin.from("bingo_cards").select("*").eq("game_id", gameId).eq("user_id", user.id).single(),
    admin.from("bingo_drawn_numbers").select("number").eq("game_id", gameId),
    admin.from("bingo_games").select("status, started_at, event_id").eq("id", gameId).single(),
  ]);

  if (!card || !game) return NextResponse.json({ error: "Dados não encontrados" }, { status: 404 });
  if (game.status !== "in_progress") return NextResponse.json({ error: "Jogo não está em andamento" }, { status: 400 });
  if (card.position) return NextResponse.json({ error: "Você já completou" }, { status: 400 });

  const drawnNumbers = drawn?.map((d) => d.number) ?? [];
  const isValid = validateBingoClaim(card.numbers as number[], card.marked_numbers as number[], drawnNumbers);
  if (!isValid) return NextResponse.json({ error: "BINGO inválido" }, { status: 400 });

  // Count current winners to determine position
  const { count } = await admin
    .from("bingo_cards")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId)
    .not("position", "is", null);

  const position = (count ?? 0) + 1;
  if (position > 5) return NextResponse.json({ error: "Já há 5 vencedores" }, { status: 400 });

  const completedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("bingo_cards")
    .update({ position, completed_at: completedAt })
    .eq("id", card.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Record in game_results
  const elapsedMs = game.started_at
    ? new Date(completedAt).getTime() - new Date(game.started_at).getTime()
    : 0;

  await admin.from("game_results").insert({
    event_id: game.event_id,
    game_type: "bingo",
    game_id: gameId,
    user_id: user.id,
    position,
    points: POINTS_MAP[position] ?? 0,
  });

  return NextResponse.json({ position, elapsed_ms: elapsedMs });
}
