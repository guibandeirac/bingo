import { describe, it, expect } from "vitest";
import { validateBingoClaim, canClaimBingo } from "./validator";
import { getRequiredIndices, getRequiredNumbers } from "./modes";

// Cartela canônica usada em todos os testes: números 1..25 nos índices 0..24.
// Layout 5x5:
//   1  2  3  4  5
//   6  7  8  9 10
//  11 12 13 14 15
//  16 17 18 19 20
//  21 22 23 24 25
const FULL_CARD = Array.from({ length: 25 }, (_, i) => i + 1);
const BORDER_NUMBERS = getRequiredNumbers(FULL_CARD, "border");
// => [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]
const X_NUMBERS = getRequiredNumbers(FULL_CARD, "x");
// => [1, 5, 7, 9, 13, 17, 19, 21, 25]
const CENTER_NUMBER = FULL_CARD[12]; // miolo, só existe no modo full e x

describe("validateBingoClaim — cartela cheia (full)", () => {
  it("válido quando todos os 25 estão marcados e sorteados", () => {
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, FULL_CARD, "full")).toBe(true);
  });

  it("default mode = full quando omitido", () => {
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, FULL_CARD)).toBe(true);
  });

  it("inválido quando a cartela não tem 25 números", () => {
    expect(validateBingoClaim(FULL_CARD.slice(0, 24), FULL_CARD, FULL_CARD, "full")).toBe(false);
  });

  it("inválido com apenas 24 marcados", () => {
    expect(validateBingoClaim(FULL_CARD, FULL_CARD.slice(0, 24), FULL_CARD, "full")).toBe(false);
  });

  it("inválido se marcou número que não foi sorteado", () => {
    const drawnSemUm = FULL_CARD.filter((n) => n !== 17);
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, drawnSemUm, "full")).toBe(false);
  });
});

describe("validateBingoClaim — extremidades (border, 16 casas)", () => {
  it("válido com as 16 bordas marcadas e sorteadas", () => {
    expect(validateBingoClaim(FULL_CARD, BORDER_NUMBERS, BORDER_NUMBERS, "border")).toBe(true);
  });

  it("inválido com cartela cheia em modo border — tem marcações fora do padrão", () => {
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, FULL_CARD, "border")).toBe(false);
  });

  it("inválido se faltar uma das bordas", () => {
    const missingOne = BORDER_NUMBERS.slice(0, BORDER_NUMBERS.length - 1);
    expect(validateBingoClaim(FULL_CARD, missingOne, BORDER_NUMBERS, "border")).toBe(false);
  });

  it("inválido se marcou uma casa do miolo junto das bordas", () => {
    const comMiolo = [...BORDER_NUMBERS, CENTER_NUMBER];
    const drawn = [...BORDER_NUMBERS, CENTER_NUMBER];
    expect(validateBingoClaim(FULL_CARD, comMiolo, drawn, "border")).toBe(false);
  });

  it("inválido se alguma borda não foi sorteada", () => {
    const drawnSemPrimeira = BORDER_NUMBERS.slice(1);
    expect(validateBingoClaim(FULL_CARD, BORDER_NUMBERS, drawnSemPrimeira, "border")).toBe(false);
  });

  it("inválido em modo border quando marcou as 9 do X (padrão errado)", () => {
    expect(validateBingoClaim(FULL_CARD, X_NUMBERS, X_NUMBERS, "border")).toBe(false);
  });
});

describe("validateBingoClaim — X (9 casas)", () => {
  it("válido com as 9 casas do X marcadas e sorteadas", () => {
    expect(validateBingoClaim(FULL_CARD, X_NUMBERS, X_NUMBERS, "x")).toBe(true);
  });

  it("inválido com apenas 8 das 9 do X", () => {
    expect(validateBingoClaim(FULL_CARD, X_NUMBERS.slice(0, 8), X_NUMBERS, "x")).toBe(false);
  });

  it("inválido se marcou número que está na borda mas não no X", () => {
    // número 2 está na borda (idx 1) mas não no X
    const wrong = [...X_NUMBERS.slice(0, 8), 2];
    expect(validateBingoClaim(FULL_CARD, wrong, [...X_NUMBERS, 2], "x")).toBe(false);
  });

  it("inválido com cartela cheia marcada em modo X", () => {
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, FULL_CARD, "x")).toBe(false);
  });

  it("inválido se as 16 bordas estão marcadas em modo X (padrão diferente)", () => {
    expect(validateBingoClaim(FULL_CARD, BORDER_NUMBERS, BORDER_NUMBERS, "x")).toBe(false);
  });

  it("inválido se alguma casa do X não foi sorteada", () => {
    const drawnSemCentro = X_NUMBERS.filter((n) => n !== CENTER_NUMBER);
    expect(validateBingoClaim(FULL_CARD, X_NUMBERS, drawnSemCentro, "x")).toBe(false);
  });
});

describe("canClaimBingo — habilita botão quando o padrão do modo está completo", () => {
  it("full: habilita com 25 marcados", () => {
    expect(canClaimBingo(FULL_CARD, FULL_CARD, "full")).toBe(true);
  });

  it("full: não habilita com 24", () => {
    expect(canClaimBingo(FULL_CARD, FULL_CARD.slice(0, 24), "full")).toBe(false);
  });

  it("border: habilita com as 16 bordas", () => {
    expect(canClaimBingo(FULL_CARD, BORDER_NUMBERS, "border")).toBe(true);
  });

  it("border: não habilita com apenas 15 bordas", () => {
    expect(canClaimBingo(FULL_CARD, BORDER_NUMBERS.slice(0, 15), "border")).toBe(false);
  });

  it("x: habilita com as 9 casas do X", () => {
    expect(canClaimBingo(FULL_CARD, X_NUMBERS, "x")).toBe(true);
  });

  it("x: não habilita com apenas 8 do X", () => {
    expect(canClaimBingo(FULL_CARD, X_NUMBERS.slice(0, 8), "x")).toBe(false);
  });
});

describe("getRequiredIndices — formato geométrico de cada modo", () => {
  it("full tem 25 índices — todos do grid 5x5", () => {
    expect(getRequiredIndices("full")).toHaveLength(25);
  });

  it("border tem 16 índices e todos estão numa linha/coluna de borda", () => {
    const idx = getRequiredIndices("border");
    expect(idx).toHaveLength(16);
    for (const i of idx) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const isBorder = row === 0 || row === 4 || col === 0 || col === 4;
      expect(isBorder).toBe(true);
    }
  });

  it("x tem 9 índices e todos estão nas diagonais", () => {
    const idx = getRequiredIndices("x");
    expect(idx).toHaveLength(9);
    for (const i of idx) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const onMainDiag = row === col;
      const onAntiDiag = row + col === 4;
      expect(onMainDiag || onAntiDiag).toBe(true);
    }
  });

  it("x inclui o centro (idx 12)", () => {
    expect(getRequiredIndices("x")).toContain(12);
  });

  it("border NÃO inclui o centro", () => {
    expect(getRequiredIndices("border")).not.toContain(12);
  });
});

// --- canClaim gate usado no BingoPlayerView (padrão do modo + status in_progress) ---
function computeCanClaim(
  card: number[],
  marked: number[],
  mode: "full" | "border" | "x",
  status: string | null,
  initialStatus: string
) {
  const resolved = status ?? initialStatus;
  return canClaimBingo(card, marked, mode) && resolved === "in_progress";
}

describe("gate de habilitação no PlayerView — padrão do modo + status", () => {
  it("full: habilita com 25 marcados e status in_progress", () => {
    expect(computeCanClaim(FULL_CARD, FULL_CARD, "full", "in_progress", "in_progress")).toBe(true);
  });

  it("border: NÃO habilita quando jogo está finalizado, mesmo com bordas completas", () => {
    expect(computeCanClaim(FULL_CARD, BORDER_NUMBERS, "border", "finished", "finished")).toBe(false);
  });

  it("x: usa initialStatus quando status realtime ainda é null", () => {
    expect(computeCanClaim(FULL_CARD, X_NUMBERS, "x", null, "in_progress")).toBe(true);
  });

  it("x: stays disabled antes do sorteio começar (status waiting)", () => {
    expect(computeCanClaim(FULL_CARD, X_NUMBERS, "x", null, "waiting")).toBe(false);
  });
});

// --- position banner and tierlist logic (mirrors BingoPlayerView state) ---
interface WinState {
  wonPosition: number | null;
  cardPosition: number | null;
}

function computeAlreadyWon({ wonPosition, cardPosition }: WinState) {
  const confirmedPosition = cardPosition ?? wonPosition;
  return { alreadyWon: confirmedPosition !== null || wonPosition !== null, confirmedPosition };
}

function simulateHandleWin(
  position: number,
  completedAt: string,
  userId: string,
  userName: string,
  prevWinners: Array<{ user_id: string; position: number; name: string; completed_at: string }>
) {
  if (prevWinners.find((w) => w.user_id === userId)) return prevWinners;
  return [...prevWinners, { user_id: userId, name: userName, position, completed_at: completedAt }]
    .sort((a, b) => a.position - b.position);
}

describe("position banner — shows correct position after server confirms", () => {
  it("banner hidden before win", () => {
    const { alreadyWon } = computeAlreadyWon({ wonPosition: null, cardPosition: null });
    expect(alreadyWon).toBe(false);
  });

  it("banner shows with correct position after server response", () => {
    const { alreadyWon, confirmedPosition } = computeAlreadyWon({ wonPosition: 1, cardPosition: null });
    expect(alreadyWon).toBe(true);
    expect(confirmedPosition).toBe(1);
  });

  it("uses card.position from realtime if available (even if wonPosition set)", () => {
    const { confirmedPosition } = computeAlreadyWon({ wonPosition: 1, cardPosition: 1 });
    expect(confirmedPosition).toBe(1);
  });

  it("position shows 2nd place correctly", () => {
    const { confirmedPosition } = computeAlreadyWon({ wonPosition: 2, cardPosition: null });
    expect(confirmedPosition).toBe(2);
  });
});

describe("tierlist — winner added immediately after server confirms (no realtime dependency)", () => {
  const userId = "user-abc";
  const userName = "João";
  const completedAt = "2024-01-01T18:00:00.000Z";

  it("adds winner to empty list", () => {
    const winners = simulateHandleWin(1, completedAt, userId, userName, []);
    expect(winners).toHaveLength(1);
    expect(winners[0].position).toBe(1);
    expect(winners[0].name).toBe(userName);
    expect(winners[0].completed_at).toBe(completedAt);
  });

  it("does not duplicate if user already in winners (from realtime)", () => {
    const existing = [{ user_id: userId, name: userName, position: 1, completed_at: completedAt }];
    const winners = simulateHandleWin(1, completedAt, userId, userName, existing);
    expect(winners).toHaveLength(1);
  });

  it("sorts winners by position when multiple winners", () => {
    const existing = [{ user_id: "user-2", name: "Maria", position: 2, completed_at: completedAt }];
    const winners = simulateHandleWin(1, completedAt, userId, userName, existing);
    expect(winners[0].position).toBe(1);
    expect(winners[1].position).toBe(2);
  });

  it("completed_at is the server timestamp (used for Brasília time display)", () => {
    const serverTime = "2024-06-15T21:30:00.000Z";
    const winners = simulateHandleWin(1, serverTime, userId, userName, []);
    expect(winners[0].completed_at).toBe(serverTime);
  });
});

// --- toBrasiliaTime formatting ---
import { toBrasiliaTime } from "../utils";

describe("toBrasiliaTime", () => {
  it("converts UTC to Brasília time (UTC-3)", () => {
    const result = toBrasiliaTime("2024-01-15T21:00:00.000Z");
    expect(result).toMatch(/^18:00:00\.\d{3}$/);
  });

  it("includes milliseconds", () => {
    const result = toBrasiliaTime("2024-01-15T21:00:00.123Z");
    expect(result).toMatch(/\.123$/);
  });

  it("handles midnight UTC (21:00 prev day Brasília)", () => {
    const result = toBrasiliaTime("2024-01-15T03:00:00.000Z");
    expect(result).toMatch(/^00:00:00\.\d{3}$/);
  });
});
