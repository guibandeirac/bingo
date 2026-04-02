import type { DbUser } from "@/types/database";

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Duo {
  player1: DbUser;
  player2: DbUser;
}

export function generateDuos(participants: DbUser[]): {
  duos: Duo[];
  oddPlayerOut: DbUser | null;
} {
  const shuffled = fisherYates(participants);
  const duos: Duo[] = [];
  let oddPlayerOut: DbUser | null = null;

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    duos.push({ player1: shuffled[i], player2: shuffled[i + 1] });
  }

  if (shuffled.length % 2 !== 0) {
    oddPlayerOut = shuffled[shuffled.length - 1];
  }

  return { duos, oddPlayerOut };
}
