import { describe, it, expect } from "vitest";
import { validateBingoClaim } from "./validator";

const FULL_CARD = Array.from({ length: 25 }, (_, i) => i + 1); // [1..25]

describe("validateBingoClaim", () => {
  it("returns true when all card numbers are marked and drawn", () => {
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, FULL_CARD)).toBe(true);
  });

  it("returns false when card has fewer than 25 numbers", () => {
    expect(validateBingoClaim(FULL_CARD.slice(0, 24), FULL_CARD, FULL_CARD)).toBe(false);
  });

  it("returns false when marked has fewer than 25 numbers", () => {
    expect(validateBingoClaim(FULL_CARD, FULL_CARD.slice(0, 24), FULL_CARD)).toBe(false);
  });

  it("returns false when a card number was not drawn", () => {
    const drawnMissingLast = FULL_CARD.slice(0, 24);
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, drawnMissingLast)).toBe(false);
  });

  it("returns false when a card number is marked but not drawn", () => {
    const drawnMissing5 = FULL_CARD.filter((n) => n !== 5);
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, drawnMissing5)).toBe(false);
  });
});

// --- canClaimBingo logic (mirrors BingoPlayerView computation) ---
function computeCanClaim(
  markedNumbers: number[],
  gameStatus: string | null,
  initialGameStatus: string
) {
  const status = gameStatus ?? initialGameStatus;
  const allMarked = markedNumbers.length === 25;
  return allMarked && status === "in_progress";
}

describe("canClaimBingo logic", () => {
  const marked25 = Array.from({ length: 25 }, (_, i) => i + 1);
  const marked24 = marked25.slice(0, 24);

  it("enabled when all 25 marked and status is in_progress", () => {
    expect(computeCanClaim(marked25, "in_progress", "in_progress")).toBe(true);
  });

  it("disabled when only 24 numbers marked", () => {
    expect(computeCanClaim(marked24, "in_progress", "in_progress")).toBe(false);
  });

  it("disabled when game is finished even if all 25 marked", () => {
    expect(computeCanClaim(marked25, "finished", "finished")).toBe(false);
  });

  it("uses initialGameStatus when gameStatus is null (before client fetch)", () => {
    expect(computeCanClaim(marked25, null, "in_progress")).toBe(true);
  });

  it("stays disabled when gameStatus is null and initialGameStatus is waiting", () => {
    expect(computeCanClaim(marked25, null, "waiting")).toBe(false);
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
  // mirrors addWinner logic from useBingoRealtime
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
    // cardPosition takes priority via ?? operator: card?.position ?? wonPosition
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
    const serverTime = "2024-06-15T21:30:00.000Z"; // 18:30 Brasília
    const winners = simulateHandleWin(1, serverTime, userId, userName, []);
    expect(winners[0].completed_at).toBe(serverTime);
  });
});

// --- toBrasiliaTime formatting ---
import { toBrasiliaTime } from "../utils";

describe("toBrasiliaTime", () => {
  it("converts UTC to Brasília time (UTC-3)", () => {
    // 21:00 UTC = 18:00 Brasília
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
