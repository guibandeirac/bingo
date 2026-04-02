"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbBingoCard, DbBingoGame, BingoWinner } from "@/types/database";

export function useBingoRealtime(gameId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<DbBingoGame["status"]>("waiting");
  const [myCard, setMyCard] = useState<DbBingoCard | null>(null);
  const [winners, setWinners] = useState<BingoWinner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialState = useCallback(async () => {
    const [gameRes, numbersRes, cardRes, winnersRes] = await Promise.all([
      supabase.from("bingo_games").select("*").eq("id", gameId).single(),
      supabase.from("bingo_drawn_numbers").select("number").eq("game_id", gameId).order("drawn_at"),
      supabase.from("bingo_cards").select("*").eq("game_id", gameId).eq("user_id", userId).maybeSingle(),
      supabase
        .from("bingo_cards")
        .select("user_id, position, completed_at, users(name)")
        .eq("game_id", gameId)
        .not("position", "is", null)
        .order("position"),
    ]);

    if (gameRes.data) setGameStatus(gameRes.data.status);
    if (numbersRes.data) setDrawnNumbers(numbersRes.data.map((r: any) => r.number));
    if (cardRes.data) setMyCard(cardRes.data);
    if (winnersRes.data) {
      setWinners(
        (winnersRes.data as any[]).map((w) => ({
          user_id: w.user_id,
          name: w.users?.name ?? "—",
          position: w.position,
          completed_at: w.completed_at ?? new Date().toISOString(),
        }))
      );
    }
    setLoading(false);
  }, [gameId, userId, supabase]);

  useEffect(() => {
    fetchInitialState();

    const channel = supabase
      .channel(`bingo-${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bingo_drawn_numbers", filter: `game_id=eq.${gameId}` },
        (payload) => {
          setDrawnNumbers((prev) => [...prev, (payload.new as any).number]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo_games", filter: `id=eq.${gameId}` },
        (payload) => {
          setGameStatus((payload.new as any).status);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bingo_cards", filter: `game_id=eq.${gameId}` },
        async (payload) => {
          const updated = payload.new as any;
          if (updated.user_id === userId) setMyCard(updated);

          if (updated.position && updated.user_id) {
            // Fetch name for this user
            const { data: usr } = await supabase
              .from("users")
              .select("name")
              .eq("id", updated.user_id)
              .single();

            setWinners((prev) => {
              if (prev.find((w) => w.user_id === updated.user_id)) return prev;
              return [
                ...prev,
                {
                  user_id: updated.user_id,
                  name: (usr as any)?.name ?? "—",
                  position: updated.position,
                  completed_at: updated.completed_at ?? new Date().toISOString(),
                },
              ].sort((a, b) => a.position - b.position);
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId, userId, supabase, fetchInitialState]);

  const markNumber = useCallback(async (number: number) => {
    if (!myCard) return;
    const newMarked = [...(myCard.marked_numbers as number[]), number];
    setMyCard((prev) => prev ? { ...prev, marked_numbers: newMarked } : prev);
    await supabase
      .from("bingo_cards")
      .update({ marked_numbers: newMarked as any })
      .eq("id", myCard.id);
  }, [myCard, supabase]);

  return { drawnNumbers, gameStatus, myCard, winners, loading, markNumber };
}
