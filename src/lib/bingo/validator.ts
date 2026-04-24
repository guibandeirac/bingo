import type { BingoGameMode } from "@/types/database";
import { getRequiredNumbers } from "./modes";

export function validateBingoClaim(
  cardNumbers: number[],
  markedNumbers: number[],
  drawnNumbers: number[],
  mode: BingoGameMode = "full"
): boolean {
  if (cardNumbers.length !== 25) return false;

  const required = getRequiredNumbers(cardNumbers, mode);
  const requiredSet = new Set(required);
  const markedSet = new Set(markedNumbers);
  const drawnSet = new Set(drawnNumbers);

  // Número de marcações precisa bater exatamente com o padrão do modo
  if (markedNumbers.length !== required.length) return false;

  // Todas as casas exigidas precisam estar marcadas E sorteadas
  for (const n of required) {
    if (!markedSet.has(n) || !drawnSet.has(n)) return false;
  }

  // Nenhuma marcação pode estar fora do padrão (evita reivindicar X com cartela cheia, etc.)
  for (const m of markedNumbers) {
    if (!requiredSet.has(m)) return false;
  }

  return true;
}

// Mirror no cliente para habilitar o botão BINGO.
// Diferente de validateBingoClaim: não exige que os números tenham sido sorteados
// (a marcação só é possível se o número foi sorteado — o BingoCell bloqueia o clique),
// mas exige que todos os do padrão estejam marcados.
export function canClaimBingo(
  cardNumbers: number[],
  markedNumbers: number[],
  mode: BingoGameMode = "full"
): boolean {
  if (cardNumbers.length !== 25) return false;
  const required = getRequiredNumbers(cardNumbers, mode);
  const markedSet = new Set(markedNumbers);
  return required.every((n) => markedSet.has(n));
}
