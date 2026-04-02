"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  eventId: string;
  type: "bingo" | "uno";
}

export default function CreateGameButton({ eventId, type }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function create() {
    setLoading(true);
    await fetch(`/api/${type}/criar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="mt-2 w-full bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
    >
      {loading ? "Criando..." : `Criar ${type === "bingo" ? "Jogo de Bingo" : "Torneio Uno"}`}
    </button>
  );
}
