"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbBingoCard, DbBingoGame, BingoWinner } from "@/types/database";

export function useBingoRealtime(gameId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<DbBingoGame["status"] | null>(null);
  const [myCard, setMyCard] = useState<DbBingoCard | null>(null);
  const [winners, setWinners] = useState<BingoWinner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialState = useCallback(async () => {
    const [gameRes, numbersRes, cardRes, completersRes] = await Promise.all([
      supabase.from("bingo_games").select("*").eq("id", gameId).single(),
      supabase.from("bingo_drawn_numbers").select("number").eq("game_id", gameId).order("drawn_at"),
      supabase.from("bingo_cards").select("*").eq("game_id", gameId).eq("user_id", userId).maybeSingle(),
      // Todos que clicaram BINGO (com ou sem posição), ordenados por tempo
      supabase
        .from("bingo_cards")
        .select("user_id, position, completed_at, users(name)")
        .eq("game_id", gameId)
        .not("completed_at", "is", null)
        .order("completed_at"),
    ]);

    if (gameRes.data) setGameStatus(gameRes.data.status);
    if (numbersRes.data) setDrawnNumbers(numbersRes.data.map((r: any) => r.number));
    if (cardRes.data) setMyCard(cardRes.data);
    if (completersRes.data) {
      setWinners(
        (completersRes.data as any[]).map((w) => ({
          user_id: w.user_id,
          name: w.users?.name ?? "—",
          position: w.position ?? null,
          completed_at: w.completed_at,
        }))
      );
    }
    setLoading(false);
  }, [gameId, userId, supabase]);

  const fetchDrawnNumbers = useCallback(async () => {
    const { data } = await supabase
      .from("bingo_drawn_numbers")
      .select("number")
      .eq("game_id", gameId)
      .order("drawn_at");
    if (data) setDrawnNumbers(data.map((r: any) => r.number));
  }, [gameId, supabase]);

  useEffect(() => {
    fetchInitialState();

    // Polling fallback (every 3s) para ambientes sem realtime disponível
    const poll = setInterval(fetchDrawnNumbers, 3000);

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

          // Captura qualquer pessoa que clicou BINGO (position ou apenas completed_at)
          if (updated.completed_at && updated.user_id) {
            const { data: usr } = await supabase
              .from("users")
              .select("name")
              .eq("id", updated.user_id)
              .single();

            setWinners((prev) => {
              const existing = prev.find((w) => w.user_id === updated.user_id);
              if (existing) {
                // Atualiza se ganhou posição depois (posição pode ter sido null antes)
                if (existing.position === null && updated.position != null) {
                  return prev
                    .map((w) => w.user_id === updated.user_id ? { ...w, position: updated.position } : w)
                    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
                }
                return prev;
              }
              return [
                ...prev,
                {
                  user_id: updated.user_id,
                  name: (usr as any)?.name ?? "—",
                  position: updated.position ?? null,
                  completed_at: updated.completed_at,
                },
              ].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [gameId, userId, supabase, fetchInitialState, fetchDrawnNumbers]);

  const addWinner = useCallback((winner: BingoWinner) => {
    setWinners((prev) => {
      if (prev.find((w) => w.user_id === winner.user_id)) return prev;
      return [...prev, winner]
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
    });
  }, []);

  const markNumber = useCallback(async (number: number) => {
    if (!myCard) return;
    const newMarked = [...(myCard.marked_numbers as number[]), number];
    setMyCard((prev) => prev ? { ...prev, marked_numbers: newMarked } : prev);
    await supabase
      .from("bingo_cards")
      .update({ marked_numbers: newMarked as any })
      .eq("id", myCard.id);
  }, [myCard, supabase]);

  return { drawnNumbers, gameStatus, myCard, winners, loading, markNumber, addWinner };
}
