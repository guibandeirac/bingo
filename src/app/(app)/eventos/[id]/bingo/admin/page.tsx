import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import BingoAdminView from "@/components/bingo/BingoAdminView";

export default async function BingoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect(`/eventos/${id}/bingo`);

  const { data: game } = await supabase.from("bingo_games").select("*").eq("event_id", id).maybeSingle();
  if (!game) notFound();

  return <BingoAdminView eventId={id} gameId={game.id} />;
}
