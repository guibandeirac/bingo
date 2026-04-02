# 03 — Fluxo de Autenticação

## Mapeamento telefone → fake email

O Supabase Auth trabalha com email. A UI expõe apenas telefone + senha.

```
phoneToFakeEmail("11999998888") → "11999998888@botconversa.games"
phoneToFakeEmail("+55 11 99999-8888") → "11999998888@botconversa.games"
```

Implementado em `src/lib/auth/helpers.ts`:
- Remove tudo que não é dígito
- Remove prefixo `55` (DDI Brasil)
- Adiciona `@botconversa.games`

## Cadastro

```typescript
supabase.auth.signUp({
  email: phoneToFakeEmail(phone),
  password,
  options: {
    data: { name, phone: normalizedPhone } // metadata → trigger
  }
})
```

O trigger `on_auth_user_created` em `auth.users` executa `handle_new_user()` que insere em `public.users` com os dados do metadata.

## Login

```typescript
supabase.auth.signInWithPassword({
  email: phoneToFakeEmail(phone),
  password,
})
```

## Session

- Client Components: `useSession()` hook em `src/hooks/useSession.ts`
- Server Components / Route Handlers: `getSupabaseServerClient()` em `src/lib/supabase/server.ts`
- Middleware: `src/middleware.ts` — refresh automático do token, redireciona para `/login` se sem sessão

## Verificar se é admin

- Server side: buscar `profile.role` em `public.users`
- Client side: `useSession().isAdmin`
- Supabase side: função SQL `public.is_admin()` usada nas políticas RLS

## Promover usuário a admin

Via ParticipantesList.tsx (botão "Promover") ou SQL:
```sql
UPDATE public.users SET role = 'admin' WHERE id = '<user_id>';
```

## Edge cases

- Telefone com espaços/traços/+55 são normalizados antes de criar o email
- Telefone duplicado → Supabase retorna `already registered` → mostrar "Telefone já cadastrado"
- Não há confirmação de email (simplificado para uso interno)
