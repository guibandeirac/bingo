import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BingoGameMode } from "@/types/database";

const VALID_MODES: BingoGameMode[] = ["full", "border", "x"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const eventId: string = body.eventId;
  const requestedMode = body.gameMode as string | undefined;
  const gameMode: BingoGameMode =
    requestedMode && VALID_MODES.includes(requestedMode as BingoGameMode)
      ? (requestedMode as BingoGameMode)
      : "full";

  const userClient = await getSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await userClient.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("bingo_games")
    .insert({ event_id: eventId, status: "waiting", game_mode: gameMode } as any)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
