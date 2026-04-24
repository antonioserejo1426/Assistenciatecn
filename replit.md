# TecnoFix — SaaS para Assistência Técnica

## Visão geral

TecnoFix é um SaaS multi-tenant em PT-BR para lojas brasileiras de assistência técnica de celulares.
Stack: pnpm monorepo (TypeScript), Express + PostgreSQL/Drizzle no backend, React + Vite + Tailwind no frontend, Stripe para cobrança recorrente, Socket.io para o scanner de código de barras pareado entre PC e celular.

## Artefatos

- `artifacts/api-server` — API Express + WS (porta 8080). Contém autenticação JWT, services, rotas, webhook Stripe.
- `artifacts/celular-saas` — Web app React + Vite (PT-BR, tema laranja TecnoFix).
- `artifacts/mockup-sandbox` — Sandbox de componentes (uso interno do agente).

## Backend (`artifacts/api-server`)

Estrutura: `routes/` (Express), `services/` (regra de negócio), `lib/` (auth, socket, stripe, logger).

Schema Drizzle (`lib/db/src/schema/`):
- `empresas` (multi-tenancy + trial), `usuarios` (bcrypt), `planos`, `assinaturas` (Stripe).
- `produtos` com `codigoBarras` único por empresa, `estoque_movimentacoes`, `vendas` + `venda_itens`.
- `tecnicos`, `servicos` (kanban OS), `servico_pecas`. `admin_master` para super_admin.

Auth (`lib/auth.ts`): JWT 30d, `requireAuth`, `requireActiveSubscription`, `requireSuperAdmin`.

Stripe: webhook em `/api/stripe/webhook` com **raw body antes do `express.json`** (`app.ts`). Sync de planos→prices no boot. Checkout com trial 7d via `STRIPE_TRIAL_DAYS`.

Scanner: Socket.io em `/socket.io`. Sala `pdv:<sessaoId>`. PC entra com `join_pdv`, celular emite `scanner:add` ou `scanner:novo`, servidor faz broadcast.

Bootstrap: super admin `antonioserejo1426@gmail.com` (senha inicial `antonioserejo90`) e 3 planos (Starter R$49,90, Profissional R$99,90, Premium R$199,90) seedados na inicialização.

## Frontend (`artifacts/celular-saas`)

- Auth: `lib/auth.tsx` (Provider com localStorage `tecnofix_token`).
- API: hooks gerados por orval (`@workspace/api-client-react`); `lib/custom-fetch.ts` injeta Bearer.
- Páginas: `/login`, `/registro`, `/` Dashboard (Recharts), `/pdv` (com QR pairing), `/scan/:sessaoId` (zxing), `/produtos`, `/estoque`, `/vendas`, `/servicos` (kanban), `/tecnicos`, `/assinatura` (+ `/sucesso`, `/cancelado`), `/configuracoes`, `/admin`.
- Layout: `components/layout.tsx` sidebar + AppLayout.

## Segredos

`SESSION_SECRET` (também usado como JWT fallback), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY`. `DATABASE_URL` via Replit DB.

## Comandos

- `pnpm --filter @workspace/db run push` — atualizar schema no banco
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e zod do OpenAPI
- Workflows: `artifacts/api-server: API Server`, `artifacts/celular-saas: web`, `artifacts/mockup-sandbox: Component Preview Server`

## Convenções pnpm workspace

Use a skill `pnpm-workspace` para detalhes.
