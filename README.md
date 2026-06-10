# NuPrego — Controle de Gastos Pessoais

App de controle financeiro pessoal com dashboard de gastos, transações, fixas e parcelados.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** — banco de dados e autenticação
- **CSS Modules** — estilização por componente, sem Tailwind
- **TypeScript**

## Arquitetura

O projeto segue **Atomic Design**:

```
components/
├── atoms/        → Button, Badge, Chip, Label, ProgressBar, ColorDot
├── molecules/    → MonthPicker, CustomSelect, CustomDateInput, CatMultiSelect, ConfirmarModal, TransactionListItem, BottomSheet, FormField
└── organisms/
    ├── ModalBase, Sidebar, NovaTransacaoModal, TransacaoDetalheModal
    ├── dashboard/   → HeroCard, ByCartaoCard, ByCategoriaCard, FixasCard, ParcelasCard, ListModal, FiltroModal, RendaModal
    └── transacoes/  → TransacoesTabs, TransacoesTabela, TransacaoRow
```

Utilitários compartilhados em `lib/format.ts` (fmt, tipoCor, MESES, etc.) e `hooks/useIsMobile.ts`.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Requer variáveis de ambiente:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Deploy

Deploy na [Vercel](https://vercel.com) com as variáveis de ambiente configuradas.
