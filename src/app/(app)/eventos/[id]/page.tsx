import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import EventoActions from "@/components/eventos/EventoActions";
import ParticipantesList from "@/components/eventos/ParticipantesList";
import CreateGameButton from "@/components/eventos/CreateGameButton";
import type { EventStatus } from "@/types/database";

const STATUS_LABELS: Record<EventStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  finished: "Finalizado",
};

export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: event },
    { data: profile },
    { data: participation },
    { data: bingoGame },
    { data: unoTournament },
  ] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).single(),
    supabase.from("users").select("*").eq("id", user!.id).single(),
    supabase.from("event_participants").select("id").eq("event_id", id).eq("user_id", user!.id).maybeSingle(),
    supabase.from("bingo_games").select("id, status").eq("event_id", id).maybeSingle(),
    supabase.from("uno_tournaments").select("id, status").eq("event_id", id).maybeSingle(),
  ]);

  if (!event) notFound();

  const isAdmin = profile?.role === "admin";
  const isParticipant = !!participation;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-500 mt-1">{formatDate(event.date)}</p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {STATUS_LABELS[event.status as EventStatus]}
          </span>
        </div>

        <EventoActions
          event={event}
          userId={user!.id}
          isAdmin={isAdmin}
          isParticipant={isParticipant}
        />
      </div>

      {/* Jogos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bingo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-2">🎰</div>
          <h2 className="font-semibold text-gray-900">Bingo</h2>
          {bingoGame ? (
            <div className="mt-3 space-y-2">
              <Link
                href={`/eventos/${id}/bingo`}
                className="block text-center bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {isParticipant ? "Ver minha cartela" : "Ver jogo"}
              </Link>
              {isAdmin && (
                <Link
                  href={`/eventos/${id}/bingo/admin`}
                  className="block text-center bg-yellow-500 text-yellow-900 rounded-lg py-2 text-sm font-medium hover:bg-yellow-600 transition-colors"
                >
                  Painel Admin
                </Link>
              )}
            </div>
          ) : isAdmin ? (
            <CreateGameButton eventId={id} type="bingo" />
          ) : (
            <p className="text-sm text-gray-400 mt-2">Aguardando início</p>
          )}
        </div>

        {/* Uno */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-2">🃏</div>
          <h2 className="font-semibold text-gray-900">Uno — Bracket</h2>
          {unoTournament ? (
            <div className="mt-3 space-y-2">
              <Link
                href={`/eventos/${id}/uno`}
                className="block text-center bg-red-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Ver Bracket
              </Link>
              {isAdmin && (
                <Link
                  href={`/eventos/${id}/uno/admin`}
                  className="block text-center bg-yellow-500 text-yellow-900 rounded-lg py-2 text-sm font-medium hover:bg-yellow-600 transition-colors"
                >
                  Painel Admin
                </Link>
              )}
            </div>
          ) : isAdmin ? (
            <CreateGameButton eventId={id} type="uno" />
          ) : (
            <p className="text-sm text-gray-400 mt-2">Aguardando início</p>
          )}
        </div>
      </div>

      {/* Participantes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Participantes</h2>
        <ParticipantesList eventId={id} isAdmin={isAdmin} currentUserId={user!.id} />
      </div>
    </div>
  );
}
