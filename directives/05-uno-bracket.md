# 05 — Uno: Duplas e Bracket Double Elimination

## Fluxo

1. Admin cria torneio via `POST /api/uno/criar` → status: `draft`
2. Admin gera duplas → `POST /api/uno/gerar-duplas` → status: `duos_generated`
3. Pode re-sortear (botão "Re-sortear Duplas") quantas vezes quiser
4. Admin gera bracket → `POST /api/uno/gerar-bracket` → status: `bracket_generated`
5. Pode re-gerar bracket (re-sorteia posições) enquanto não iniciar
6. Admin registra resultados das partidas via clique no BracketView
7. Ao definir todos os resultados, criar finais individuais manualmente

## Double Elimination Math

Para `n` duplas:
- `bracketSize = próxima potência de 2 ≥ n`
- `byeCount = bracketSize - n`
- `totalWbRounds = log2(bracketSize)` (ex: 8 duplas → 3 rounds)
- `lbTotalRounds = 2 * (totalWbRounds - 1)` (ex: 8 duplas → 4 rounds LB)

### Exemplo com 6 duplas → bracket de 8

```
WB R1: M1(D1 vs D2), M2(D3 vs BYE), M3(D4 vs D5), M4(D6 vs BYE)
WB R2: M5(W1 vs W2), M6(W3 vs W4)
WB Final: M7(W5 vs W6)

LB R1: M8(L1 vs L3), M9(L2 vs L4)  [losers from WB R1]
LB R2: M10(W8 vs W9)
LB R3: M11(W10 vs L5), M12(outro par)
LB R4: M13(LB Final)

Grand Final: M14(WB Winner vs LB Winner)
```

## Linking de partidas (dois passes)

```typescript
// Passo 1: insert todos os matches sem next_winner/loser IDs
// Passo 2: construir mapa match_number → UUID, resolver referências
for (const update of updates) {
  await supabase.from("uno_bracket_matches")
    .update({ next_winner_match_id, next_loser_match_id })
    .eq("id", update.id)
}
```

## Registrar resultado

`POST /api/uno/registrar-resultado`:
1. Recebe `matchId` e `winnerId`
2. Busca a partida para descobrir `loserId`
3. `UPDATE winner_id = winnerId` na partida
4. Avança vencedor para `next_winner_match_id` (preenche `duo1_id` ou `duo2_id` livre)
5. Envia perdedor para `next_loser_match_id` (apenas para partidas do WB)

## Byes

- Duplas com BYE têm `winner_id = duo_não_nulo` imediatamente ao criar
- `is_bye = true` na partida
- O vencedor do bye é automaticamente vinculado à próxima partida via `next_winner_match_id`

## Finais Individuais (x1)

Após Grand Final, admin cria manualmente 3 partidas de `uno_individual_finals`:
- `first_second`: jogadores da dupla campeã
- `third_fourth`: jogadores da dupla vice-campeã
- `fifth_sixth`: jogadores da dupla semi-finalista (apenas 5º pontua)

Via interface no `IndividualFinals.tsx` — admin clica no vencedor.

## Pontuação Uno

| Posição | Pontos |
|---------|--------|
| 1º | 30 |
| 2º | 25 |
| 3º | 20 |
| 4º | 15 |
| 5º | 10 |

Ao definir vencedor de `uno_individual_finals`, inserir em `game_results` manualmente ou via trigger.

## Edge cases

- Número ímpar de participantes: API retorna `oddPlayerOut` com o nome, admin vê aviso
- Re-sortear duplas deleta as antigas e insere novas (`DELETE FROM uno_duos WHERE tournament_id = ?`)
- Re-gerar bracket deleta as partidas antigas antes de inserir novas
