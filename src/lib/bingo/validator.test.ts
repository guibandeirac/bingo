import { describe, it, expect } from "vitest";
import { validateBingoClaim } from "./validator";

const makeCard = (nums: number[]) => nums; // 25 numbers
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
    const drawnMissingLast = FULL_CARD.slice(0, 24); // missing number 25
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, drawnMissingLast)).toBe(false);
  });

  it("returns false when a card number is marked but not drawn", () => {
    const drawnMissing5 = FULL_CARD.filter((n) => n !== 5);
    expect(validateBingoClaim(FULL_CARD, FULL_CARD, drawnMissing5)).toBe(false);
  });

  it("returns false when marked_numbers has 25 but some are not on the card", () => {
    const wrongMarked = [...FULL_CARD.slice(0, 24), 99]; // 99 not on card
    expect(validateBingoClaim(FULL_CARD, wrongMarked, [...FULL_CARD, 99])).toBe(false);
  });
});

// --- canClaimBingo logic (mirrors BingoPlayerView computation) ---
function computeCanClaim(
  markedNumbers: number[],
  gameStatus: string | null,
  initialGameStatus: string
) {
  const status = gameStatus ?? initialGameStatus;
  const markedCount = markedNumbers.length;
  const allMarked = markedCount === 25;
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

  it("disabled when game is waiting even if all 25 marked", () => {
    expect(computeCanClaim(marked25, "waiting", "waiting")).toBe(false);
  });

  // Key regression: gameStatus null should fall back to initialGameStatus
  it("uses initialGameStatus when gameStatus is null (before client fetch)", () => {
    // Before fix: gameStatus was initialized to "waiting", so ?? never used initialGameStatus
    // After fix: gameStatus starts as null, so initialGameStatus = "in_progress" is used
    expect(computeCanClaim(marked25, null, "in_progress")).toBe(true);
  });

  it("stays disabled when gameStatus is null and initialGameStatus is waiting", () => {
    expect(computeCanClaim(marked25, null, "waiting")).toBe(false);
  });
});
