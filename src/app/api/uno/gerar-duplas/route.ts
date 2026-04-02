import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  const { tournamentId } = await req.json();
  const userClient = await getSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: profile } = await userClient.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const admin = getSupabaseAdminClient();
  const { data: tournament } = await admin.from("uno_tournaments").select("event_id").eq("id", tournamentId).single();
  if (!tournament) return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });

  const { data: participants } = await admin
    .from("event_participants")
    .select("user_id, users(*)")
    .eq("event_id", tournament.event_id);

  if (!participants?.length) return NextResponse.json({ error: "Sem participantes" }, { status: 400 });

  const users: any[] = fisherYates(participants.map((p: any) => p.users).filter(Boolean));

  // Se número ímpar: emparelha o último com Robo (player2_id = null)
  const duos: Array<{ player1_id: string; player2_id: string | null; seed: number }> = [];
  for (let i = 0; i < users.length; i += 2) {
    duos.push({
      player1_id: users[i].id,
      player2_id: users[i + 1]?.id ?? null, // null = Robo
      seed: duos.length + 1,
    });
  }

  // Delete old duos
  await admin.from("uno_duos").delete().eq("tournament_id", tournamentId);

  // Insert new duos
  const inserts = duos.map((d) => ({
    tournament_id: tournamentId,
    player1_id: d.player1_id,
    player2_id: d.player2_id,
    seed: d.seed,
  }));

  const { error } = await admin.from("uno_duos").insert(inserts as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("uno_tournaments").update({ status: "duos_generated" }).eq("id", tournamentId);

  const hasRobo = duos.some((d) => d.player2_id === null);
  return NextResponse.json({ duos: inserts.length, hasRobo });
}
