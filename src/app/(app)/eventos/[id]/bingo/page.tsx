import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import BingoPlayerView from "@/components/bingo/BingoPlayerView";

export default async function BingoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: game } = await supabase
    .from("bingo_games")
    .select("*")
    .eq("event_id", id)
    .maybeSingle();

  if (!game) notFound();

  const { data: card } = await supabase
    .from("bingo_cards")
    .select("*")
    .eq("game_id", game.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <BingoPlayerView
      gameId={game.id}
      userId={user.id}
      initialCard={card}
      initialGameStatus={game.status}
    />
  );
}
