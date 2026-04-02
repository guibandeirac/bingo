# 06 — Deploy

## Supabase (já configurado)

- Projeto: `suuqqghjykttxbxigody`
- Aplicar migrations: ver `directives/02-database-migrations.md`
- Verificar saúde: `python execution/check_supabase_health.py`

## Vercel

### Deploy inicial

```bash
npm install -g vercel
vercel deploy --prod
```

### Variáveis de ambiente obrigatórias (Vercel Dashboard → Settings → Environment Variables)

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://suuqqghjykttxbxigody.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_jgHbsm...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_wEf2mNSSo...` |

> ⚠️ NUNCA expor `SUPABASE_SERVICE_ROLE_KEY` no frontend. Ela só deve ser usada em API routes (server-side).

### Supabase — configurar domínio autorizado

No Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: URL de produção do Vercel (ex: `https://bingo.vercel.app`)
- **Redirect URLs**: adicionar o mesmo URL + `/api/auth/callback`

## Smoke test pós-deploy

```bash
python execution/check_supabase_health.py
```

Acesse manualmente:
1. `https://seu-app.vercel.app/cadastro` — criar conta
2. Fazer login com telefone + senha
3. Criar evento, inscrever, criar jogo de bingo
4. Gerar cartelas, iniciar, sortear

## Troubleshooting comum

| Problema | Solução |
|----------|---------|
| Login falha após deploy | Verificar Site URL no Supabase Auth |
| Realtime não funciona | Verificar se tabelas estão na publicação `supabase_realtime` |
| RLS bloqueando admin | Verificar se `public.is_admin()` function existe |
| Cartelas não geram | Verificar `SUPABASE_SERVICE_ROLE_KEY` nas env vars do Vercel |
