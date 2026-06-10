@AGENTS.md

# Arquitetura NuPrego

## Stack
- **Next.js 16** (App Router, Turbopack)
- **Supabase** SSR (`@supabase/ssr`)
- **CSS Modules** — um `.module.css` por componente
- **CSS Custom Properties** — valores dinâmicos (cores de API) passados via `style={{ '--var': value }}`
- **Sem Tailwind** — removido; `postcss.config.mjs` usa apenas `{}`
- **Sem inline CSS** — toda estilização em CSS Module ou global

---

## Atomic Design

```
components/
├── atoms/           → elementos primitivos sem estado
│   ├── Button.tsx          + Button.module.css
│   ├── Badge.tsx           + Badge.module.css
│   ├── Chip.tsx            + Chip.module.css
│   ├── Label.tsx           (usa global .label-caps)
│   ├── ProgressBar.tsx     + ProgressBar.module.css
│   ├── ColorDot.tsx
│   └── index.ts
│
├── molecules/       → composições de átomos, sem fetch
│   ├── FormField.tsx        + FormField.module.css
│   ├── BottomSheet.tsx      + BottomSheet.module.css  ← usado por CustomSelect/CustomDateInput no mobile
│   ├── MonthPicker.tsx      + MonthPicker.module.css
│   ├── CustomSelect.tsx     + CustomSelect.module.css
│   ├── CustomDateInput.tsx  + CustomDateInput.module.css
│   ├── CatMultiSelect.tsx   + CatMultiSelect.module.css
│   ├── ConfirmarModal.tsx   + ConfirmarModal.module.css
│   ├── TransactionListItem.tsx + TransactionListItem.module.css
│   └── index.ts
│
└── organisms/       → seções completas, podem ter fetch
    ├── ModalBase.tsx        + ModalBase.module.css
    ├── Sidebar.tsx          + Sidebar.module.css
    ├── NovaTransacaoModal.tsx  + NovaTransacaoModal.module.css
    ├── TransacaoDetalheModal.tsx + TransacaoDetalheModal.module.css
    ├── index.ts
    │
    ├── dashboard/           → sub-componentes da dashboard
    │   ├── HeroCard.tsx
    │   ├── ByCartaoCard.tsx
    │   ├── ByCategoriaCard.tsx
    │   ├── FixasCard.tsx
    │   ├── ParcelasCard.tsx
    │   ├── ListModal.tsx
    │   ├── FiltroModal.tsx
    │   ├── RendaModal.tsx
    │   ├── Dashboard.module.css   ← CSS compartilhado dos cards
    │   └── index.ts
    │
    └── transacoes/          → sub-componentes da página de transações
        ├── TransacoesTabs.tsx   + TransacoesTabs.module.css
        ├── TransacoesTabela.tsx + TransacoesTabela.module.css
        ├── TransacaoRow.tsx     + TransacaoRow.module.css
        └── index.ts
```

---

## Utilitários compartilhados

```
lib/format.ts         → fmt, pct, fmtData, MESES, MESES_ABREV, tipoCor, tipoLabel, meioCor, meioLabel
hooks/useIsMobile.ts  → hook SSR-safe para breakpoint mobile
```

---

## CSS

### globals.css mantém
- Design tokens (`:root` CSS custom properties)
- Reset geral (`* { box-sizing }`)
- Tipografia (`.label-caps`, `.font-display`, `.tabular`)
- Componentes globais: `.card`, `.btn-*`, `.modal`, `.modal-overlay`, `.progress-track`
- Layouts de página: `.page-header`, `.two-col-grid`, `.filters-row`, `.main-content`
- Responsividade das tabelas: `.table-row`, `.table-row-data`, `.table-col-hide-mobile`

### Sidebar CSS → `Sidebar.module.css` (não mais no globals)

---

## Padrão de cores dinâmicas
```tsx
// CSS vars para cores vindas do banco
<div style={{ '--badge-color': cor, '--badge-bg': cor+'22' } as React.CSSProperties}>
```
```css
/* No .module.css */
.badge { color: var(--badge-color); background: var(--badge-bg); }
```

---

## Páginas

| Arquivo | LOC aprox | Responsabilidade |
|---|---|---|
| `app/page.tsx` | ~100 | Container dashboard — só estado + fetch |
| `app/transacoes/page.tsx` | ~150 | Container transações — só estado + fetch |
| `app/fixas/page.tsx` | mantido | Usa novos imports de molecules/organisms |
| `app/parcelados/page.tsx` | mantido | Usa novos imports de molecules/organisms |

---

## Próximo passo
Aplicar **claymorphism** na dashboard — as páginas são finas o suficiente para mudanças de estilo só em CSS.
