import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import UnoPlayerView from "@/components/uno/UnoPlayerView";

export default async function UnoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tournament } = await supabase.from("uno_tournaments").select("*").eq("event_id", id).maybeSingle();
  if (!tournament) notFound();

  return <UnoPlayerView tournamentId={tournament.id} />;
}
