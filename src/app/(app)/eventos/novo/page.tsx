import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import EventoForm from "@/components/eventos/EventoForm";

export default async function NovoEventoPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("role").eq("id", user!.id).single();

  if (profile?.role !== "admin") redirect("/eventos");

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Evento</h1>
      <EventoForm userId={user!.id} />
    </div>
  );
}
