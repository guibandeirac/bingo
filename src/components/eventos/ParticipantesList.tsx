"use client";
import { useEventParticipants } from "@/hooks/useEventParticipants";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
  eventId: string;
  isAdmin: boolean;
  currentUserId: string;
}

export default function ParticipantesList({ eventId, isAdmin, currentUserId }: Props) {
  const { participants, loading } = useEventParticipants(eventId);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  async function handleRemove(userId: string) {
    await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    router.refresh();
  }

  async function handlePromote(userId: string) {
    await supabase.from("users").update({ role: "admin" }).eq("id", userId);
    router.refresh();
  }

  if (loading) return <p className="text-gray-400 text-sm">Carregando...</p>;
  if (!participants.length) return <p className="text-gray-400 text-sm">Nenhum participante.</p>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">{participants.length} participante(s)</p>
      {participants.map((p) => (
        <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div>
            <span className="font-medium text-gray-800">{p.name}</span>
            {p.role === "admin" && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
            )}
            {isAdmin && (
              <span className="ml-2 text-xs text-gray-400">{p.phone}</span>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              {p.role !== "admin" && (
                <button
                  onClick={() => handlePromote(p.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Promover
                </button>
              )}
              {p.id !== currentUserId && (
                <button
                  onClick={() => handleRemove(p.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
