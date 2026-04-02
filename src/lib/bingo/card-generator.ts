function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSingleCard(): number[] {
  const pool = Array.from({ length: 90 }, (_, i) => i + 1);
  const shuffled = fisherYates(pool);
  return shuffled.slice(0, 25);
}

export function generateUniqueCards(playerCount: number): number[][] {
  const generated = new Set<string>();
  const cards: number[][] = [];

  let attempts = 0;
  const maxAttempts = playerCount * 100;

  while (cards.length < playerCount && attempts < maxAttempts) {
    attempts++;
    const card = generateSingleCard();
    // Use sorted version as canonical key for dedup
    const key = [...card].sort((a, b) => a - b).join(",");
    if (!generated.has(key)) {
      generated.add(key);
      cards.push(card);
    }
  }

  if (cards.length < playerCount) {
    throw new Error(`Não foi possível gerar ${playerCount} cartelas únicas`);
  }

  return cards;
}
