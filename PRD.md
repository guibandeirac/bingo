# PRD — BotConversa Games

## 1. Visão Geral

**BotConversa Games** é um web app de jogos para equipes, focado em sessões de Bingo e torneios de Uno (bracket). O app gerencia participantes, gera cartelas, sorteia números em tempo real, organiza brackets double elimination e mantém um dashboard de ranking mensal.

- **Idioma:** Português BR (100%)
- **Plataforma:** Web (responsivo, mobile-first)
- **Stack:** Next.js 14+ (App Router), Supabase (Auth, Database, Realtime), Tailwind CSS, TypeScript
- **Deploy:** Vercel + Supabase Cloud

---

## 2. Usuários e Roles

| Role | Descrição |
|------|-----------|
| **Admin** | Cria eventos, gerencia bingo (chamador), gerencia brackets, promove usuários, atualiza resultados |
| **Jogador** | Se inscreve em eventos, joga bingo (marca cartela), visualiza bracket e dashboard |

- Qualquer conta pode ser promovida a Admin por outro Admin.
- Não há limite de admins.

---

## 3. Autenticação

- Cadastro com **nome**, **telefone** e **senha**.
- Login com **telefone + senha**.
- Sem confirmação de email/SMS (simplificado).
- Cada conta é individual e identificada pelo nome.
- O telefone fica armazenado para futuras automações (ex: enviar links via WhatsApp).
- Usar **Supabase Auth** (email-based internamente, mas a UI expõe como telefone + senha). Alternativa: usar o campo `phone` do Supabase Auth se viável, ou mapear telefone → email fictício para simplificar.

---

## 4. Conceito de Evento / Sessão

Tudo gira em torno de **Eventos**. Um evento agrupa os jogos de uma ocasião (ex: "Sexta de Jogos — 04/04/2026").

### Campos do Evento
- Nome (ex: "Sexta de Jogos")
- Data
- Status: `aberto` (inscrições abertas), `em andamento`, `finalizado`
- Jogos vinculados: Bingo e/ou Bracket Uno

### Fluxo
1. Admin cria o evento.
2. Jogadores se inscrevem no evento (entram na lista de participantes).
3. Admin inicia os jogos dentro do evento.
4. Ao finalizar, os resultados vão para o histórico e o dashboard.

---

## 5. Lista de Participantes

- Exibe todos os inscritos no evento atual.
- Mostra: nome, telefone (visível só para admin).
- Jogadores podem se inscrever/desinscrever enquanto o evento estiver `aberto`.
- Admin pode remover participantes.
- Sem limite de participantes.

---

## 6. Bingo

### 6.1 Regras
- Bingo clássico **1–90**.
- Cartela **5×5** (25 números aleatórios entre 1 e 90, sem espaço livre).
- Condição de vitória: **cartela inteira preenchida** (full house).
- **5 vencedores** por jogo (1º ao 5º a completar).
- Um jogo de bingo por vez.

### 6.2 Fluxo do Jogo

#### Admin (Chamador)
1. Clica em **"Gerar Cartelas"** → o sistema gera uma cartela única para cada inscrito.
2. Clica em **"Sortear Número"** → sorteia um número aleatório (não repetido) entre 1 e 90.
3. Opção: ativar **modo automático** com intervalo configurável em segundos (ex: a cada 5s, 10s, 15s...).
4. Vê o painel com: número atual, histórico de números sorteados, tierlist/ranking de quem completou.

#### Jogador
1. Vê sua cartela 5×5 na tela.
2. Quando um número é sorteado, ele aparece **em tempo real** na tela de todos (via Supabase Realtime).
3. Os números na cartela têm **3 estados visuais**:
   - **Branco**: não foi sorteado ainda → não clicável.
   - **Amarelo**: foi sorteado mas não foi marcado pelo jogador → clicável.
   - **Verde**: foi sorteado E marcado pelo jogador.
4. O jogador **só pode clicar** em números que já foram sorteados (amarelos).
5. Quando todos os 25 números da cartela estiverem verdes (marcados), o botão **"BINGO!"** fica habilitado.
6. Ao clicar "BINGO!", o sistema valida se todos os números marcados realmente já foram sorteados.
7. Se válido: registra o jogador na classificação com **timestamp em milissegundos**.
8. Se inválido (cenário de edge case): rejeita silenciosamente e o jogo continua.

### 6.3 Tierlist / Classificação
- Exibe os 5 primeiros a completar o bingo.
- Mostra: posição, nome, tempo (mm:ss.ms — desde o início do jogo).
- Visível para todos (jogadores e admins).
- Após o 5º vencedor, o jogo pode ser encerrado pelo admin.

### 6.4 Pontuação
| Posição | Pontos |
|---------|--------|
| 1º | 30 |
| 2º | 25 |
| 3º | 20 |
| 4º | 15 |
| 5º | 10 |

---

## 7. Uno — Duplas e Bracket

> O Uno é jogado em app externo. O BotConversa Games gerencia apenas: sorteio de duplas, bracket, e resultados.

### 7.1 Sorteio de Duplas
- Com base nos inscritos do evento, o sistema gera **duplas aleatórias**.
- Se o número de inscritos for ímpar, o admin é notificado para resolver (remover alguém ou adicionar).
- Exibe as duplas geradas.
- Botão **"Shuffle"** para re-sortear as duplas (quantas vezes quiser antes de confirmar).
- Admin confirma as duplas para prosseguir.

### 7.2 Bracket — Double Elimination
- Formato: **Double Elimination** (Winners Bracket + Losers Bracket).
- O número de duplas define o tamanho do bracket.
- Se não for potência de 2, o sistema adiciona **byes** automaticamente, distribuídos aleatoriamente.
- Botão **"Shuffle"** para re-sortear a ordem/posição das duplas no bracket antes de iniciar.
- Visualização gráfica do bracket completo (winners + losers) com linhas conectando as partidas.

#### Fluxo de Resultados
1. Admin seleciona a partida.
2. Admin registra a dupla vencedora.
3. O bracket atualiza automaticamente (avança vencedor, move perdedor para losers bracket).
4. Na **Grand Final**: dupla da winners vs dupla da losers.

#### Finais Individuais (1x1)
Após a final do bracket de duplas:
- **Dupla campeã**: os 2 jogadores fazem um x1 → define 1º e 2º lugar.
- **Dupla vice-campeã**: os 2 jogadores fazem um x1 → define 3º e 4º lugar.
- **Dupla eliminada na final da losers bracket** (semi da losers): os 2 jogadores fazem um x1 → define 5º e 6º lugar. Apenas o 5º recebe pontos.

O admin registra os resultados desses x1 também.

### 7.3 Pontuação Uno
| Posição | Pontos |
|---------|--------|
| 1º | 30 |
| 2º | 25 |
| 3º | 20 |
| 4º | 15 |
| 5º | 10 |

---

## 8. Dashboard de Rankings

### 8.1 Ranking Mensal
- Exibe os jogadores ordenados por **total de pontos no mês**.
- Mostra: posição, nome, total de pontos, nº de vitórias (1º lugar).
- Destaque visual para o líder (topo do ranking).
- Filtro por mês/ano.

### 8.2 Histórico de Eventos
- Lista de todos os eventos passados.
- Ao clicar em um evento: mostra os jogos que aconteceram, resultados, classificações.
- Dados persistentes (nunca são apagados).

---

## 9. Telas do App

### 9.1 Públicas (não autenticado)
- **Login** — telefone + senha
- **Cadastro** — nome, telefone, senha

### 9.2 Jogador
- **Home / Dashboard** — ranking mensal, próximo evento, histórico
- **Evento** — detalhes do evento, botão de inscrição, lista de participantes
- **Bingo** — cartela do jogador, número sorteado, classificação
- **Bracket Uno** — visualização do bracket, duplas, resultados

### 9.3 Admin (além das telas de jogador)
- **Gerenciar Evento** — criar/editar evento, abrir/fechar inscrições
- **Gerenciar Participantes** — lista completa, promover a admin
- **Painel do Bingo** — gerar cartelas, sortear números (manual/auto), ver classificação
- **Painel do Bracket** — gerar duplas, shuffle, gerar bracket, registrar resultados das partidas e dos x1 finais

---

## 10. Modelo de Dados (Supabase / PostgreSQL)

### Tabelas Principais

```
users
├── id (uuid, PK)
├── name (text)
├── phone (text, unique)
├── role (enum: 'player' | 'admin')
├── created_at (timestamptz)

events
├── id (uuid, PK)
├── name (text)
├── date (date)
├── status (enum: 'open' | 'in_progress' | 'finished')
├── created_by (uuid, FK → users)
├── created_at (timestamptz)

event_participants
├── id (uuid, PK)
├── event_id (uuid, FK → events)
├── user_id (uuid, FK → users)
├── joined_at (timestamptz)

bingo_games
├── id (uuid, PK)
├── event_id (uuid, FK → events)
├── status (enum: 'waiting' | 'cards_generated' | 'in_progress' | 'finished')
├── auto_mode (boolean, default false)
├── auto_interval_seconds (integer, nullable)
├── started_at (timestamptz, nullable)
├── created_at (timestamptz)

bingo_drawn_numbers
├── id (uuid, PK)
├── game_id (uuid, FK → bingo_games)
├── number (integer, 1-90)
├── drawn_at (timestamptz)

bingo_cards
├── id (uuid, PK)
├── game_id (uuid, FK → bingo_games)
├── user_id (uuid, FK → users)
├── numbers (jsonb — array de 25 números)
├── marked_numbers (jsonb — array de números marcados pelo jogador)
├── completed_at (timestamptz, nullable)
├── position (integer, nullable — 1 a 5)

uno_tournaments
├── id (uuid, PK)
├── event_id (uuid, FK → events)
├── status (enum: 'draft' | 'duos_generated' | 'bracket_generated' | 'in_progress' | 'finals' | 'finished')
├── created_at (timestamptz)

uno_duos
├── id (uuid, PK)
├── tournament_id (uuid, FK → uno_tournaments)
├── player1_id (uuid, FK → users)
├── player2_id (uuid, FK → users)
├── seed (integer — posição no bracket)

uno_bracket_matches
├── id (uuid, PK)
├── tournament_id (uuid, FK → uno_tournaments)
├── bracket_type (enum: 'winners' | 'losers' | 'grand_final')
├── round (integer)
├── match_number (integer)
├── duo1_id (uuid, nullable, FK → uno_duos)
├── duo2_id (uuid, nullable, FK → uno_duos)
├── winner_id (uuid, nullable, FK → uno_duos)
├── is_bye (boolean, default false)
├── next_winner_match_id (uuid, nullable, FK → uno_bracket_matches)
├── next_loser_match_id (uuid, nullable, FK → uno_bracket_matches)

uno_individual_finals
├── id (uuid, PK)
├── tournament_id (uuid, FK → uno_tournaments)
├── match_type (enum: 'first_second' | 'third_fourth' | 'fifth_sixth')
├── player1_id (uuid, FK → users)
├── player2_id (uuid, FK → users)
├── winner_id (uuid, nullable, FK → users)

game_results
├── id (uuid, PK)
├── event_id (uuid, FK → events)
├── game_type (enum: 'bingo' | 'uno')
├── game_id (uuid — referência ao bingo_games.id ou uno_tournaments.id)
├── user_id (uuid, FK → users)
├── position (integer, 1-5)
├── points (integer)
├── achieved_at (timestamptz)
```

---

## 11. Realtime (Supabase Realtime)

Canais/subscriptions necessários:

| Canal | Uso |
|-------|-----|
| `bingo_drawn_numbers` | Jogadores recebem novos números sorteados em tempo real |
| `bingo_cards` (filtrado por user) | Atualização do estado da cartela |
| `bingo_games` | Status do jogo (início, fim, modo auto) |
| `uno_bracket_matches` | Atualizações do bracket em tempo real |
| `event_participants` | Lista de participantes atualizada |

---

## 12. Regras de Negócio Importantes

1. **Cartelas são únicas**: nenhum jogador recebe a mesma combinação de 25 números.
2. **Números sorteados são globais**: todos veem o mesmo número ao mesmo tempo.
3. **Marcação é individual**: cada jogador marca sua própria cartela.
4. **Validação do BINGO**: o sistema verifica se todos os 25 números da cartela estão na lista de números sorteados E estão marcados.
5. **Timestamp de vitória**: registrado no momento do clique em "BINGO!", com precisão de milissegundos.
6. **Byes no bracket**: distribuídos aleatoriamente; duplas com bye avançam automaticamente.
7. **Shuffle**: disponível tanto para duplas quanto para posições no bracket, antes de confirmar/iniciar.
8. **Pontuação**: apenas os 5 primeiros colocados recebem pontos (30/25/20/15/10).
9. **Dashboard mensal**: soma de pontos de todos os jogos do mês.

---

## 13. Requisitos Não-Funcionais

- **Performance**: cartelas e números devem renderizar instantaneamente; latência do realtime < 500ms.
- **Responsividade**: funcionar bem em celular (maioria dos jogadores estará no celular).
- **Escalabilidade**: sem limite de participantes (embora improvável passar de 20).
- **Segurança**: RLS no Supabase — jogadores só veem sua própria cartela; admins veem tudo.
- **Persistência**: todos os dados são persistidos para histórico.

---

## 14. Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| State Management | React hooks + Supabase Realtime subscriptions |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |

---

## 15. Fases de Desenvolvimento Sugeridas

### Fase 1 — Fundação
- Auth (cadastro, login, roles)
- CRUD de eventos
- Lista de participantes + inscrição

### Fase 2 — Bingo
- Geração de cartelas
- Sorteio de números (manual + automático)
- Cartela interativa do jogador (estados visuais)
- Validação de BINGO + classificação com timestamp
- Realtime completo

### Fase 3 — Uno (Bracket)
- Sorteio de duplas + shuffle
- Geração de bracket double elimination + byes
- Visualização gráfica do bracket (winners + losers)
- Registro de resultados pelo admin
- Finais individuais (x1)

### Fase 4 — Dashboard e Histórico
- Ranking mensal com pontuação acumulada
- Histórico de eventos e resultados
- Destaque visual para líderes

### Fase 5 — Polish
- Animações e micro-interações
- Notificações in-app
- Preparação para futuras automações (WhatsApp via telefone)
- Testes e ajustes de UX

---

## 16. Futuro (Fora do Escopo Atual)
- Integração WhatsApp (enviar links de eventos, notificar resultados).
- Novos jogos (a definir).
- Sistema de conquistas/badges.
- Modo espectador.
