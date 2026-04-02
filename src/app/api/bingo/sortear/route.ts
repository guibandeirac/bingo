import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const userClient = await getSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await userClient.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const admin = getSupabaseAdminClient();

  // Get game and already drawn numbers
  const [{ data: game }, { data: drawn }] = await Promise.all([
    admin.from("bingo_games").select("status, started_at").eq("id", gameId).single(),
    admin.from("bingo_drawn_numbers").select("number").eq("game_id", gameId),
  ]);

  if (!game) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
  if (game.status === "finished") return NextResponse.json({ error: "Jogo finalizado" }, { status: 400 });
  if (game.status === "waiting" || game.status === "cards_generated") {
    return NextResponse.json({ error: "Jogo não iniciado" }, { status: 400 });
  }

  const drawnSet = new Set(drawn?.map((d) => d.number) ?? []);
  if (drawnSet.size >= 90) return NextResponse.json({ error: "Todos os números já sorteados" }, { status: 400 });

  // Pick a random number not yet drawn
  let number: number;
  do {
    number = Math.floor(Math.random() * 90) + 1;
  } while (drawnSet.has(number));

  const { error } = await admin.from("bingo_drawn_numbers").insert({ game_id: gameId, number });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ number });
}
