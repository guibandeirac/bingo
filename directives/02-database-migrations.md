# 02 — Migrations do Banco de Dados

## Como aplicar

### Opção A — Script Python (recomendado)
```bash
cd execution
pip install -r requirements.txt
python generate_migration.py
```

### Opção B — Supabase Dashboard SQL Editor
Abra https://suuqqghjykttxbxigody.supabase.co, vá em SQL Editor, e execute cada bloco em ordem.

## Ordem das migrations

1. `001_extensions_and_enums` — extensões e enums
2. `002_core_tables` — users, events, event_participants
3. `003_bingo_tables` — bingo_games, bingo_drawn_numbers, bingo_cards
4. `004_uno_tables` — uno_tournaments, uno_duos, uno_bracket_matches, uno_individual_finals, game_results
5. `005_indexes` — índices de performance
6. `006_rls` — Row Level Security + função `is_admin()`
7. `007_trigger_new_user` — trigger que popula `public.users` ao criar conta
8. `008_realtime` — habilita Realtime nas tabelas necessárias
9. `009_exec_sql_helper` — função auxiliar para o script Python

## Como verificar

```bash
python execution/check_supabase_health.py
```
Deve retornar HTTP 200 para todas as 11 tabelas.

## Como regenerar tipos TypeScript

```bash
npx supabase gen types typescript --project-id suuqqghjykttxbxigody > src/types/database.ts
```

Mas atenção: o arquivo `src/types/database.ts` atual tem tipos customizados de UI além dos tipos gerados. Mescle com cuidado ou mantenha os dois separados.

## Edge cases

- Se um enum já existir, a migration 001 usa `EXCEPTION WHEN duplicate_object THEN NULL` para ser idempotente
- Se executar múltiplas vezes: `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY` evita conflitos
- Realtime: se a tabela já estiver na publicação, o `ALTER PUBLICATION ADD TABLE` silencia o erro com o bloco `DO $$ BEGIN ... EXCEPTION WHEN others THEN null; END $$`
