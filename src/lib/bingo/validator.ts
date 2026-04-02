export function validateBingoClaim(
  cardNumbers: number[],
  markedNumbers: number[],
  drawnNumbers: number[]
): boolean {
  if (cardNumbers.length !== 25) return false;
  if (markedNumbers.length !== 25) return false;

  const drawnSet = new Set(drawnNumbers);
  const markedSet = new Set(markedNumbers);

  // All card numbers must be marked AND all marked must have been drawn
  return cardNumbers.every(
    (n) => markedSet.has(n) && drawnSet.has(n)
  );
}
