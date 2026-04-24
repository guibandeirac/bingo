import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { validateBingoClaim } from "@/lib/bingo/validator";
import type { BingoGameMode } from "@/types/database";

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
    admin.from("bingo_games").select("status, started_at, event_id, game_mode").eq("id", gameId).single(),
  ]);

  if (!card || !game) return NextResponse.json({ error: "Dados não encontrados" }, { status: 404 });
  if (game.status !== "in_progress") return NextResponse.json({ error: "Jogo não está em andamento" }, { status: 400 });
  if (card.completed_at) return NextResponse.json({ error: "Você já clicou no BINGO" }, { status: 400 });

  const drawnNumbers = drawn?.map((d) => d.number) ?? [];
  const gameMode: BingoGameMode = ((game as any).game_mode ?? "full") as BingoGameMode;
  const isValid = validateBingoClaim(
    card.numbers as number[],
    card.marked_numbers as number[],
    drawnNumbers,
    gameMode
  );
  if (!isValid) return NextResponse.json({ error: "BINGO inválido" }, { status: 400 });

  // Atribui posição de forma atômica via função PostgreSQL.
  // Registra completed_at para todos — inclusive quem chegar após o top 5.
  const { data: result, error: rpcError } = await admin
    .rpc("claim_bingo_position", { p_game_id: gameId, p_card_id: card.id });

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  if (result?.error === "already_claimed") {
    return NextResponse.json({ error: "Você já clicou no BINGO" }, { status: 400 });
  }
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const position: number | null = result?.position ?? null;
  const completedAt: string = result?.completed_at ?? new Date().toISOString();

  const elapsedMs = game.started_at
    ? new Date(completedAt).getTime() - new Date(game.started_at).getTime()
    : 0;

  // Só entra no ranking quem ficou no top 5
  if (position !== null) {
    await admin.from("game_results").insert({
      event_id: game.event_id,
      game_type: "bingo",
      game_id: gameId,
      user_id: user.id,
      position,
      points: POINTS_MAP[position] ?? 0,
    });
  }

  return NextResponse.json({ position, completed_at: completedAt, elapsed_ms: elapsedMs });
}
