export type DemoTx = {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'fixa' | 'parcelada' | 'avulsa';
  cartao_id: number | null;
  categoria_id: number | null;
  categoria_ids: number[];
  meio_pagamento: string | null;
  parcela_atual: number;
  total_parcelas: number;
  grupo_parcela: string | null;
  fatura_ano: number;
  fatura_mes: number;
  pago: boolean;
  observacao: string | null;
};

export type DemoCartao = { id: number; nome: string; cor: string; fechamento: number; vencimento: number; ativo: boolean; limite: number };
export type DemoCategoria = { id: number; nome: string; icone: string; cor: string };

export const DEMO_CARTOES: DemoCartao[] = [
  { id: 1, nome: 'Nubank', cor: '#8A05BE', fechamento: 5, vencimento: 12, ativo: true, limite: 6000 },
  { id: 2, nome: 'Inter', cor: '#FF7A00', fechamento: 10, vencimento: 17, ativo: true, limite: 4000 },
];

export const DEMO_CATEGORIAS: DemoCategoria[] = [
  { id: 1, nome: 'Alimentação', icone: '🍔', cor: '#6edab4' },
  { id: 2, nome: 'Transporte', icone: '🚗', cor: '#ffb783' },
  { id: 3, nome: 'Moradia', icone: '🏠', cor: '#8083ff' },
  { id: 4, nome: 'Lazer', icone: '🎮', cor: '#00b8d4' },
  { id: 5, nome: 'Saúde', icone: '💊', cor: '#f87171' },
];

const Y = 2026, M = 6;
const p = (n: number) => String(n).padStart(2, '0');
let _id = 100;
const t = (o: Partial<DemoTx>): DemoTx => ({
  id: _id++, descricao: '', valor: 0, data: `${Y}-${p(M)}-01`,
  tipo: 'avulsa', cartao_id: null, categoria_id: null, categoria_ids: [],
  meio_pagamento: null, parcela_atual: 1, total_parcelas: 1, grupo_parcela: null,
  fatura_ano: Y, fatura_mes: M, pago: true, observacao: null, ...o,
});

export const DEMO_TRANSACOES_INICIAIS: DemoTx[] = [
  // ── Fixas ──
  t({ descricao: 'Aluguel', valor: 1800, data: `${Y}-${p(M)}-01`, tipo: 'fixa', categoria_id: 3, categoria_ids: [3] }),
  t({ descricao: 'Netflix', valor: 55.90, data: `${Y}-${p(M)}-01`, tipo: 'fixa', cartao_id: 1, categoria_id: 4, categoria_ids: [4] }),
  t({ descricao: 'Spotify', valor: 21.90, data: `${Y}-${p(M)}-01`, tipo: 'fixa', cartao_id: 1, categoria_id: 4, categoria_ids: [4] }),
  t({ descricao: 'Academia Smart Fit', valor: 89.90, data: `${Y}-${p(M)}-01`, tipo: 'fixa', meio_pagamento: 'pix', categoria_id: 5, categoria_ids: [5] }),
  t({ descricao: 'Internet NET', valor: 139.90, data: `${Y}-${p(M)}-01`, tipo: 'fixa', cartao_id: 1, categoria_id: 3, categoria_ids: [3] }),

  // ── Parceladas ──
  t({ descricao: 'iPhone 15 6/12', valor: 487.50, data: `${Y}-${p(M)}-03`, tipo: 'parcelada', cartao_id: 1, parcela_atual: 6, total_parcelas: 12, grupo_parcela: 'demo-iphone' }),
  t({ descricao: 'Airfryer Mondial 3/5', valor: 159.80, data: `${Y}-${p(M)}-10`, tipo: 'parcelada', cartao_id: 2, categoria_id: 1, categoria_ids: [1], parcela_atual: 3, total_parcelas: 5, grupo_parcela: 'demo-airfryer' }),
  t({ descricao: 'Curso React Dev 2/3', valor: 166.67, data: `${Y}-${p(M)}-05`, tipo: 'parcelada', meio_pagamento: 'pix', categoria_id: 4, categoria_ids: [4], parcela_atual: 2, total_parcelas: 3, grupo_parcela: 'demo-curso' }),

  // ── Avulsas ──
  t({ descricao: 'Supermercado Extra', valor: 312.40, data: `${Y}-${p(M)}-07`, cartao_id: 2, categoria_id: 1, categoria_ids: [1] }),
  t({ descricao: 'iFood', valor: 67.80, data: `${Y}-${p(M)}-08`, meio_pagamento: 'pix', categoria_id: 1, categoria_ids: [1] }),
  t({ descricao: 'Uber', valor: 38.50, data: `${Y}-${p(M)}-09`, meio_pagamento: 'pix', categoria_id: 2, categoria_ids: [2] }),
  t({ descricao: 'Posto Shell', valor: 180.00, data: `${Y}-${p(M)}-10`, cartao_id: 2, categoria_id: 2, categoria_ids: [2] }),
  t({ descricao: 'Farmácia São Paulo', valor: 95.40, data: `${Y}-${p(M)}-11`, meio_pagamento: 'pix', categoria_id: 5, categoria_ids: [5] }),
  t({ descricao: 'Happy hour com amigos', valor: 120.00, data: `${Y}-${p(M)}-12`, meio_pagamento: 'pix', categoria_id: 4, categoria_ids: [4] }),
  t({ descricao: 'Restaurante Boi Gordo', valor: 89.90, data: `${Y}-${p(M)}-13`, cartao_id: 1, categoria_id: 1, categoria_ids: [1] }),
  t({ descricao: 'Uber (aeroporto)', valor: 54.00, data: `${Y}-${p(M)}-06`, meio_pagamento: 'pix', categoria_id: 2, categoria_ids: [2] }),
];

export const DEMO_RENDAS_INICIAIS: Record<string, number> = {
  [`${Y}-${M}`]: 5500,
  [`${Y}-${M - 1}`]: 5500,
};
