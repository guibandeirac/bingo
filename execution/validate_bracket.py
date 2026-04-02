"""
Valida e imprime a estrutura de um bracket double elimination.

Uso:
    python validate_bracket.py <numero_de_duplas>

Exemplo:
    python validate_bracket.py 6
"""

import sys
import math
import random


def next_power_of_2(n: int) -> int:
    p = 1
    while p < n: p *= 2
    return p


def fisher_yates(arr: list) -> list:
    a = arr[:]
    for i in range(len(a) - 1, 0, -1):
        j = random.randint(0, i)
        a[i], a[j] = a[j], a[i]
    return a


class Match:
    counter = 0

    def __init__(self, bracket_type: str, round_: int, duo1=None, duo2=None, is_bye=False):
        Match.counter += 1
        self.id = Match.counter
        self.bracket_type = bracket_type
        self.round = round_
        self.duo1 = duo1
        self.duo2 = duo2
        self.is_bye = is_bye
        self.next_winner: "Match | None" = None
        self.next_loser: "Match | None" = None
        self.winner = duo1 if is_bye and duo1 else (duo2 if is_bye and duo2 else None)

    def __repr__(self):
        d1 = f"Dupla {self.duo1}" if self.duo1 else "TBD"
        d2 = f"Dupla {self.duo2}" if self.duo2 else ("BYE" if self.is_bye else "TBD")
        suffix = " [BYE]" if self.is_bye else ""
        return f"M{self.id}({self.bracket_type[0].upper()}R{self.round}: {d1} vs {d2}{suffix})"


def build_bracket(n: int) -> list[Match]:
    Match.counter = 0
    bracket_size = next_power_of_2(n)
    bye_count = bracket_size - n
    total_wb_rounds = int(math.log2(bracket_size))

    seeded = fisher_yates(list(range(1, n + 1)) + [None] * bye_count)

    matches: list[Match] = []

    # WB Round 1
    wb_r1: list[Match] = []
    for i in range(0, bracket_size, 2):
        d1, d2 = seeded[i], seeded[i + 1]
        is_bye = d1 is None or d2 is None
        m = Match("winners", 1, d1, d2, is_bye)
        wb_r1.append(m)
        matches.append(m)

    # WB Rounds 2+
    prev_wb = wb_r1
    all_wb_by_round = {1: wb_r1}
    for r in range(2, total_wb_rounds + 1):
        curr: list[Match] = []
        for i in range(0, len(prev_wb), 2):
            m = Match("winners", r)
            if i < len(prev_wb): prev_wb[i].next_winner = m
            if i + 1 < len(prev_wb): prev_wb[i + 1].next_winner = m
            curr.append(m)
            matches.append(m)
        all_wb_by_round[r] = curr
        prev_wb = curr

    wb_final = prev_wb[0]

    # LB
    lb_total_rounds = 2 * (total_wb_rounds - 1)
    lb_by_round: dict[int, list[Match]] = {}

    for lbr in range(1, lb_total_rounds + 1):
        wb_drop_round = math.ceil(lbr / 2)
        prev_lb = lb_by_round.get(lbr - 1, []) if lbr > 1 else []
        wb_drops = all_wb_by_round.get(wb_drop_round, [])

        if lbr == 1:
            count = bracket_size // 4
        elif lbr % 2 == 1:
            count = max(len(prev_lb), 1)
        else:
            count = max(len(prev_lb) // 2, 1)
        count = max(count, 1)

        curr_lb: list[Match] = []
        for i in range(count):
            m = Match("losers", lbr)
            curr_lb.append(m)
            matches.append(m)

            if lbr % 2 == 1 and i < len(wb_drops):
                wb_drops[i].next_loser = m
            if lbr % 2 == 0 and i * 2 < len(prev_lb):
                prev_lb[i * 2].next_winner = m
                if i * 2 + 1 < len(prev_lb):
                    prev_lb[i * 2 + 1].next_winner = m
            elif lbr % 2 == 1 and i < len(prev_lb):
                prev_lb[i].next_winner = m

        lb_by_round[lbr] = curr_lb

    lb_final = lb_by_round.get(lb_total_rounds, [None])[0]

    # Grand Final
    gf = Match("grand_final", 1)
    matches.append(gf)
    if wb_final: wb_final.next_winner = gf
    if lb_final: lb_final.next_winner = gf

    return matches


def print_bracket(matches: list[Match]) -> None:
    print("\n=== WINNERS BRACKET ===")
    for m in [m for m in matches if m.bracket_type == "winners"]:
        nw = f"→W:{m.next_winner.id}" if m.next_winner else ""
        nl = f"→L:{m.next_loser.id}" if m.next_loser else ""
        print(f"  {m} {nw} {nl}")

    print("\n=== LOSERS BRACKET ===")
    for m in [m for m in matches if m.bracket_type == "losers"]:
        nw = f"→W:{m.next_winner.id}" if m.next_winner else ""
        print(f"  {m} {nw}")

    print("\n=== GRAND FINAL ===")
    for m in [m for m in matches if m.bracket_type == "grand_final"]:
        print(f"  {m}")

    print(f"\nTotal de partidas: {len(matches)}")


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    print(f"Simulando bracket double elimination com {n} duplas...")
    ms = build_bracket(n)
    print_bracket(ms)
