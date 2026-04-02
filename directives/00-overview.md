# 00 — Visão Geral: BotConversa Games

## O que é este projeto

Web app de jogos para equipes. Funcionalidades principais:
- **Bingo**: Sortear números 1-90 em tempo real, cartelas 5×5, 5 vencedores
- **Uno — Bracket**: Double Elimination com duplas sorteadas, bracket gráfico, finais individuais
- **Dashboard**: Ranking mensal com pontuação acumulada

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| UI | shadcn/ui + componentes customizados |
| Backend | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| Deploy | Vercel (frontend) + Supabase Cloud |

## Supabase

- **URL:** `https://suuqqghjykttxbxigody.supabase.co`
- **Anon key:** `sb_publishable_jgHbsm_jKpzT76E-uHRsFQ_oXcESk5P`
- **Service role:** em `.env.local` (nunca expor no frontend)

## Autenticação

- Cadastro/login com **telefone + senha**
- Internamente: telefone é mapeado para `{numero}@botconversa.games` (fake email)
- Função: `phoneToFakeEmail(phone)` em `src/lib/auth/helpers.ts`
- Trigger no Supabase cria registro em `public.users` ao criar conta Auth

## Roles

| Role | Pode |
|------|------|
| `player` | Ver eventos, inscrever-se, jogar bingo, ver bracket |
| `admin` | Criar eventos, gerenciar bingo, gerenciar bracket, promover usuários |

## Idioma

100% Português BR. Código em inglês, UI em PT-BR.

## Arquitetura (3 camadas conforme CLAUDE.md)

1. **Diretivas** (`directives/`) — este arquivo e os demais SOPs
2. **Orquestração** — o agente AI lê diretivas e chama execução
3. **Execução** (`execution/`) — scripts Python + API routes do Next.js

## Estrutura de diretórios relevante

```
src/
  app/
    (auth)/           # login, cadastro
    (app)/            # layout autenticado, dashboard, eventos, bingo, uno
    api/              # route handlers (bingo/, uno/)
  components/         # bingo/, uno/, dashboard/, layout/, eventos/
  hooks/              # useSession, useBingoRealtime, useBracketRealtime
  lib/                # supabase/, auth/, bingo/, uno/, utils.ts
  types/database.ts   # tipos TypeScript das tabelas
  middleware.ts       # proteção de rotas
execution/            # scripts Python
directives/           # este diretório
```
