import type { DbUnoDuo } from "@/types/database";

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface MatchSeed {
  tournament_id: string;
  bracket_type: "winners" | "losers" | "grand_final";
  round: number;
  match_number: number;
  duo1_id: string | null;
  duo2_id: string | null;
  winner_id: string | null;
  is_bye: boolean;
  // References resolved after first pass
  next_winner_match_ref: number | null; // match_number in winners bracket
  next_loser_match_ref: number | null;  // match_number in losers bracket
  // Will be populated after DB insert
  next_winner_match_id: string | null;
  next_loser_match_id: string | null;
}

export function buildDoubleElimBracket(
  tournamentId: string,
  duos: DbUnoDuo[]
): MatchSeed[] {
  const n = duos.length;
  if (n < 2) throw new Error("Mínimo de 2 duplas necessário");

  const bracketSize = nextPowerOf2(n);
  const byeCount = bracketSize - n;

  // Seeded list: duo ids + nulls for byes, shuffled
  const seeded: (string | null)[] = fisherYates([
    ...duos.map((d) => d.id),
    ...Array(byeCount).fill(null),
  ]);

  const matches: MatchSeed[] = [];
  let matchCounter = 1;

  // ─── Winners Bracket ───────────────────────────────────────────────────────
  // Round 1
  const wbRound1Matches: MatchSeed[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const duo1 = seeded[i];
    const duo2 = seeded[i + 1];
    const isBye = duo1 === null || duo2 === null;
    const m: MatchSeed = {
      tournament_id: tournamentId,
      bracket_type: "winners",
      round: 1,
      match_number: matchCounter++,
      duo1_id: duo1,
      duo2_id: duo2,
      winner_id: isBye ? (duo1 ?? duo2) : null,
      is_bye: isBye,
      next_winner_match_ref: null,
      next_loser_match_ref: null,
      next_winner_match_id: null,
      next_loser_match_id: null,
    };
    wbRound1Matches.push(m);
    matches.push(m);
  }

  // Remaining WB rounds
  const totalWbRounds = Math.log2(bracketSize); // e.g. 8 teams → 3 rounds
  let prevRoundMatches = wbRound1Matches;

  for (let r = 2; r <= totalWbRounds; r++) {
    const roundMatches: MatchSeed[] = [];
    for (let i = 0; i < prevRoundMatches.length; i += 2) {
      const m: MatchSeed = {
        tournament_id: tournamentId,
        bracket_type: "winners",
        round: r,
        match_number: matchCounter++,
        duo1_id: null,
        duo2_id: null,
        winner_id: null,
        is_bye: false,
        next_winner_match_ref: null,
        next_loser_match_ref: null,
        next_winner_match_id: null,
        next_loser_match_id: null,
      };
      roundMatches.push(m);
      matches.push(m);

      // Link feeders to this match
      if (prevRoundMatches[i]) {
        prevRoundMatches[i].next_winner_match_ref = m.match_number;
      }
      if (prevRoundMatches[i + 1]) {
        prevRoundMatches[i + 1].next_winner_match_ref = m.match_number;
      }
    }
    prevRoundMatches = roundMatches;
  }

  const wbFinal = prevRoundMatches[0];

  // ─── Losers Bracket ────────────────────────────────────────────────────────
  // Double-elim LB structure for bracketSize teams:
  // LB has 2*(log2(bracketSize)-1) rounds
  // Odd LB rounds receive dropdowns from WB
  // Even LB rounds are pure LB matches
  const lbRounds = 2 * (totalWbRounds - 1);
  const lbRoundMatches: MatchSeed[][] = [];

  // WB dropdowns by WB round:
  // WB round 1 losers → LB round 1
  // WB round 2 losers → LB round 3
  // WB round 3 losers → LB round 5 ... etc.
  const wbMatchesByRound: MatchSeed[][] = [];
  for (const m of matches.filter((m) => m.bracket_type === "winners")) {
    if (!wbMatchesByRound[m.round]) wbMatchesByRound[m.round] = [];
    wbMatchesByRound[m.round].push(m);
  }

  for (let lbr = 1; lbr <= lbRounds; lbr++) {
    const prevLbRound = lbr > 1 ? lbRoundMatches[lbr - 2] : null;
    const wbDropRound = Math.ceil(lbr / 2); // WB round that feeds into this LB round (odd LB rounds)

    let matchCount: number;
    if (lbr === 1) {
      matchCount = bracketSize / 4; // e.g., 8 → 2
    } else if (lbr % 2 === 1) {
      // Odd round: survivors from previous LB round meet WB dropdowns
      matchCount = Math.ceil((prevLbRound?.length ?? 1));
    } else {
      // Even round: pure LB (no WB dropdowns)
      matchCount = Math.ceil((prevLbRound?.length ?? 1) / 2);
    }

    // Clamp to at least 1
    matchCount = Math.max(matchCount, 1);

    const roundMatches: MatchSeed[] = [];
    const wbDropMatchesForRound = lbr % 2 === 1
      ? (wbMatchesByRound[wbDropRound] ?? [])
      : [];

    for (let i = 0; i < matchCount; i++) {
      const m: MatchSeed = {
        tournament_id: tournamentId,
        bracket_type: "losers",
        round: lbr,
        match_number: matchCounter++,
        duo1_id: null,
        duo2_id: null,
        winner_id: null,
        is_bye: false,
        next_winner_match_ref: null,
        next_loser_match_ref: null,
        next_winner_match_id: null,
        next_loser_match_id: null,
      };
      roundMatches.push(m);
      matches.push(m);

      // Link WB dropout → this LB match (as loser path)
      if (lbr % 2 === 1 && wbDropMatchesForRound[i]) {
        wbDropMatchesForRound[i].next_loser_match_ref = m.match_number;
      }
      // Link previous LB round winners → this match
      if (lbr % 2 === 0 && prevLbRound) {
        const feeder1 = prevLbRound[i * 2];
        const feeder2 = prevLbRound[i * 2 + 1];
        if (feeder1) feeder1.next_winner_match_ref = m.match_number;
        if (feeder2) feeder2.next_winner_match_ref = m.match_number;
      } else if (lbr % 2 === 1 && prevLbRound) {
        const feeder = prevLbRound[i];
        if (feeder) feeder.next_winner_match_ref = m.match_number;
      }
    }

    lbRoundMatches.push(roundMatches);
  }

  const lbFinal = lbRoundMatches[lbRoundMatches.length - 1]?.[0];

  // ─── Grand Final ───────────────────────────────────────────────────────────
  const grandFinal: MatchSeed = {
    tournament_id: tournamentId,
    bracket_type: "grand_final",
    round: 1,
    match_number: matchCounter++,
    duo1_id: null,
    duo2_id: null,
    winner_id: null,
    is_bye: false,
    next_winner_match_ref: null,
    next_loser_match_ref: null,
    next_winner_match_id: null,
    next_loser_match_id: null,
  };
  matches.push(grandFinal);

  if (wbFinal) wbFinal.next_winner_match_ref = grandFinal.match_number;
  if (lbFinal) lbFinal.next_winner_match_ref = grandFinal.match_number;

  return matches;
}
