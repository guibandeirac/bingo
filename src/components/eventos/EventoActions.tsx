"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbEvent, EventStatus } from "@/types/database";

interface Props {
  event: DbEvent;
  userId: string;
  isAdmin: boolean;
  isParticipant: boolean;
}

const STATUS_NEXT: Partial<Record<EventStatus, EventStatus>> = {
  open: "in_progress",
  in_progress: "finished",
};

const STATUS_NEXT_LABEL: Partial<Record<EventStatus, string>> = {
  open: "Iniciar Evento",
  in_progress: "Finalizar Evento",
};

export default function EventoActions({ event, userId, isAdmin, isParticipant }: Props) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    await supabase.from("event_participants").insert({ event_id: event.id, user_id: userId });
    router.refresh();
    setLoading(false);
  }

  async function handleLeave() {
    setLoading(true);
    await supabase.from("event_participants").delete().eq("event_id", event.id).eq("user_id", userId);
    router.refresh();
    setLoading(false);
  }

  async function handleStatusChange() {
    const next = STATUS_NEXT[event.status];
    if (!next) return;
    setLoading(true);
    await supabase.from("events").update({ status: next }).eq("id", event.id);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {/* Inscrição — disponível para todos, incluindo admins */}
      {event.status === "open" && (
        isParticipant ? (
          <button
            onClick={handleLeave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
          >
            Cancelar inscrição
          </button>
        ) : (
          <button
            onClick={handleJoin}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            Inscrever-se
          </button>
        )
      )}

      {/* Admin actions */}
      {isAdmin && STATUS_NEXT[event.status] && (
        <button
          onClick={handleStatusChange}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-yellow-500 text-yellow-900 rounded-lg hover:bg-yellow-600 disabled:opacity-60 transition-colors"
        >
          {STATUS_NEXT_LABEL[event.status]}
        </button>
      )}
    </div>
  );
}
