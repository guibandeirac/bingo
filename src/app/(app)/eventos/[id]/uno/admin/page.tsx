import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import UnoAdminView from "@/components/uno/UnoAdminView";

export default async function UnoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect(`/eventos/${id}/uno`);

  const { data: tournament } = await supabase.from("uno_tournaments").select("*").eq("event_id", id).maybeSingle();
  if (!tournament) notFound();

  return <UnoAdminView eventId={id} tournamentId={tournament.id} />;
}
