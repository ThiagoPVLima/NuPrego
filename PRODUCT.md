# NuPrego

## What it is

NuPrego is a personal finance control app for a single user. It tracks monthly expenses by credit card billing cycle, distinguishes between fixed recurring expenses, installment purchases, and one-off transactions, and gives the user a clear view of what they owe each month.

## Register

product

## Who uses it

One person — the owner — managing their personal finances across multiple credit cards, PIX installment arrangements, and recurring bills.

## Core problems it solves

- Credit card billing cycles mean a purchase in May might appear on June's bill. NuPrego handles this automatically via a configurable "fechamento" (closing date) per card.
- PIX installment payments (paying someone directly in monthly chunks) follow a different rhythm than credit cards and need to be tracked separately.
- Fixed monthly expenses (rent, subscriptions) need to be projected forward automatically even if the user hasn't manually entered them for a given month.

## Key screens

- **Dashboard** — monthly overview: total spent, income, balance, breakdown by type (fixed/installment/one-off), by card/payment method, by category. Shows fixed expenses and installments for the month.
- **Transações (Transactions)** — full list of all transactions for a selected month, split into two tabs: "Fatura" (credit card bill) and "PIX / Dinheiro" (direct PIX/cash installments). Filters by card, type, and search.
- **Parcelados (Installments)** — grouped view of all installment purchases with progress bars, remaining balance, and advance-payment actions.
- **Fixas (Fixed expenses)** — grouped view of all recurring monthly expenses, with activate/deactivate toggle and scope-aware editing.
- **Cartões (Cards)** — manage credit cards with closing date, due date, color, and limit.
- **Histórico (History)** — bar chart of monthly spending over time.
- **Configurações (Settings)** — categories CRUD, card closing dates, PIX correction utility, Excel import.

## Tech stack

- Next.js 15 (App Router)
- React 19
- Supabase (PostgreSQL + Auth)
- Tailwind CSS 4 + CSS variables (custom design system)
- Deployed on Vercel

## Design language

Dark-first UI with a custom CSS variable system. Primary accent is purple (`#8083ff`), secondary green (`#6edab4`), warning orange (`#ffb783`), error red (`#f87171`). Fonts: Manrope (headings/UI), JetBrains Mono (numbers/labels). Cards use `var(--surface)` with subtle borders. Tables use a CSS grid-based `.table-row` pattern. Light mode is supported via `html.light` class.

## Brand personality

Clean, minimal, and data-dense. Inspired by fintech tools — precise, trustworthy, and fast. Not flashy, but polished. Numbers should be readable at a glance.
