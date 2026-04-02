# 04 — Motor de Bingo

## Fluxo completo

1. Admin cria jogo via `POST /api/bingo/criar` → status: `waiting`
2. Admin clica "Gerar Cartelas" → `POST /api/bingo/gerar-cartelas` → status: `cards_generated`
3. Admin clica "Iniciar Jogo" → `POST /api/bingo/iniciar` → status: `in_progress`, `started_at = now()`
4. Admin sorteia → `POST /api/bingo/sortear` → insere em `bingo_drawn_numbers`
5. Jogadores marcam células amarelas → `UPDATE bingo_cards SET marked_numbers = [...]`
6. Quando todos 25 marcados → botão "BINGO!" habilitado
7. `POST /api/bingo/bingo` → valida, registra posição + `completed_at`
8. Admin encerra → `UPDATE bingo_games SET status = 'finished'`

## Algoritmo de geração de cartelas

```typescript
// src/lib/bingo/card-generator.ts
function generateSingleCard(): number[] {
  // Pool 1-90, shuffle Fisher-Yates, pegar primeiros 25
  // Retorna em ordem aleatória (não ordenada) — aparência visual
}

function generateUniqueCards(n: number): number[][] {
  // Gera cards únicos usando canonical key (sorted) para dedup
  // Collision prob com 90 choose 25 ≈ 4.8T é negligível para n≤20
}
```

## Estados visuais das células

| Estado | Condição | Visual |
|--------|----------|--------|
| `white` | número não sorteado | fundo branco, não clicável |
| `yellow` | sorteado mas não marcado | amarelo, clicável |
| `green` | sorteado E marcado | verde, não clicável |

Lógica em `BingoCard.tsx`:
```typescript
if (marked && drawn) → "green"
if (drawn && !marked) → "yellow"
else → "white"
```

## Realtime

Um canal por gameId com 3 listeners:
- `INSERT` em `bingo_drawn_numbers` → adiciona ao array de sorteados
- `UPDATE` em `bingo_games` → atualiza status
- `UPDATE` em `bingo_cards` → atualiza vencedores na tierlist

## Modo automático

Admin define intervalo (5/10/15/20/30s). `setInterval` no browser do admin chama `POST /api/bingo/sortear` repetidamente. O admin deve estar na página. Toggling `auto_mode` em `bingo_games` é salvo no banco.

## Validação do BINGO (server-side)

```typescript
// src/lib/bingo/validator.ts
validateBingoClaim(cardNumbers, markedNumbers, drawnNumbers):
  // Todos os 25 números da cartela devem estar:
  // 1. Em markedNumbers (marcados pelo jogador)
  // 2. Em drawnNumbers (realmente sorteados)
```

## Pontuação

| Posição | Pontos |
|---------|--------|
| 1º | 30 |
| 2º | 25 |
| 3º | 20 |
| 4º | 15 |
| 5º | 10 |

Ao registrar BINGO válido: insere em `game_results` com posição e pontos.

## Race conditions

Se dois jogadores clicam BINGO simultaneamente:
- Server conta `position = COUNT(bingo_cards WHERE position IS NOT NULL) + 1`
- O banco tem UNIQUE constraint implícita — o segundo a escrever pega posição 2
- Se já há 5 vencedores, retorna 400

## Edge cases

- `bingo_drawn_numbers` tem UNIQUE(game_id, number) — sortear o mesmo número duas vezes retorna erro 409, o script deve ignorar e tentar novamente
- Se `auto_mode` estiver ativo e o admin fechar o browser, o sorteio para (comportamento esperado)
