import type { BingoGameMode } from "@/types/database";

// Índices (0-24) sobre o grid 5x5 que precisam ser completados em cada modo.
//
// Layout do grid:
//   0  1  2  3  4
//   5  6  7  8  9
//  10 11 12 13 14
//  15 16 17 18 19
//  20 21 22 23 24
const REQUIRED_INDICES: Record<BingoGameMode, number[]> = {
  // Cartela cheia: todas as 25 casas
  full: Array.from({ length: 25 }, (_, i) => i),
  // Extremidades: linha de cima + linha de baixo + colunas das bordas (16 casas)
  border: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24],
  // X: duas diagonais, interseção no centro — 9 casas
  x: [0, 4, 6, 8, 12, 16, 18, 20, 24],
};

export const GAME_MODE_LABELS: Record<BingoGameMode, string> = {
  full: "Cartela cheia",
  border: "Extremidades",
  x: "X",
};

export function getRequiredIndices(mode: BingoGameMode): number[] {
  return REQUIRED_INDICES[mode];
}

export function getRequiredNumbers(
  cardNumbers: number[],
  mode: BingoGameMode
): number[] {
  return getRequiredIndices(mode).map((i) => cardNumbers[i]);
}

export function isRequiredIndex(mode: BingoGameMode, index: number): boolean {
  return getRequiredIndices(mode).includes(index);
}
