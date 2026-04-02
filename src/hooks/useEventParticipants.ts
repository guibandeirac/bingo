"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbUser } from "@/types/database";

export function useEventParticipants(eventId: string) {
  const supabase = getSupabaseBrowserClient();
  const [participants, setParticipants] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("event_participants")
      .select("user_id, users(*)")
      .eq("event_id", eventId)
      .order("joined_at");
    if (data) {
      setParticipants(data.map((d: any) => d.users).filter(Boolean));
    }
    setLoading(false);
  }, [eventId, supabase]);

  useEffect(() => {
    fetchParticipants();

    const channel = supabase
      .channel(`participants-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_participants", filter: `event_id=eq.${eventId}` },
        () => fetchParticipants()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, supabase, fetchParticipants]);

  return { participants, loading, refetch: fetchParticipants };
}
