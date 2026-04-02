import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { DbEvent, EventStatus } from "@/types/database";

const STATUS_LABELS: Record<EventStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  finished: "Finalizado",
};

const STATUS_COLORS: Record<EventStatus, string> = {
  open: "bg-green-100 text-green-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  finished: "bg-gray-100 text-gray-600",
};

export default async function EventosPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: events }, { data: profile }, { data: myParticipations }] = await Promise.all([
    supabase.from("events").select("*").order("date", { ascending: false }),
    supabase.from("users").select("role").eq("id", user!.id).single(),
    supabase.from("event_participants").select("event_id").eq("user_id", user!.id),
  ]);

  const isAdmin = profile?.role === "admin";
  const myEventIds = new Set(myParticipations?.map((p) => p.event_id) ?? []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        {isAdmin && (
          <Link
            href="/eventos/novo"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            + Novo Evento
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {!events?.length && (
          <p className="text-gray-500 text-center py-12">Nenhum evento criado ainda.</p>
        )}
        {events?.map((event: DbEvent) => (
          <Link
            key={event.id}
            href={`/eventos/${event.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-gray-900">{event.name}</h2>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
                  {STATUS_LABELS[event.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{formatDate(event.date)}</p>
            </div>
            <div className="flex items-center gap-3">
              {myEventIds.has(event.id) && (
                <span className="text-xs text-blue-600 font-medium">Inscrito</span>
              )}
              <span className="text-gray-400">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
