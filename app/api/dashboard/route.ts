import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()));
  const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));

  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAno = mes === 12 ? ano + 1 : ano;
  const mesPrefix = `${ano}-${String(mes).padStart(2, '0')}`;
  const firstDayOfM = `${mesPrefix}-01`;

  const [transacoes, cartoes, meses, pixParceladosNext, prevFixasRes, fixasConfigRes] = await Promise.all([
    supabase.from('transacoes')
      .select('*, cartoes(id,nome,cor), categorias(id,nome,cor)')
      .eq('fatura_ano', ano).eq('fatura_mes', mes),
    supabase.from('cartoes').select('*').eq('ativo', true).order('id'),
    supabase.from('meses').select('*').eq('ano', ano).eq('mes', mes).single(),
    supabase.from('transacoes')
      .select('*, cartoes(id,nome,cor), categorias(id,nome,cor)')
      .eq('tipo', 'parcelada')
      .is('cartao_id', null)
      .eq('fatura_ano', nextAno)
      .eq('fatura_mes', nextMes),
    supabase.from('transacoes')
      .select('descricao, valor, tipo, meio_pagamento, cartao_id, categoria_id, categoria_ids, data')
      .eq('tipo', 'fixa')
      .lt('data', firstDayOfM)
      .order('data', { ascending: false })
      .limit(500),
    supabase.from('fixas_config').select('descricao, ativa, data_inicio'),
  ]);

  // Projeção de fixas sem entrada explícita neste mês (mesma lógica de /api/transacoes)
  const norm = (s: string) => (s || '').toLowerCase().trim();
  const fixasConfig: Record<string, { ativa: boolean; data_inicio: string | null }> = {};
  for (const c of (fixasConfigRes?.data || [])) {
    fixasConfig[norm(c.descricao)] = { ativa: !!c.ativa, data_inicio: c.data_inicio };
  }
  const monthsBetween = (a: string, b: string) => {
    const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number);
    return (by - ay) * 12 + (bm - am);
  };
  const shouldProject = (descricao: string, lastData: string) => {
    const cfg = fixasConfig[norm(descricao)];
    if (cfg) {
      if (cfg.ativa === false) return false;
      if (cfg.data_inicio && firstDayOfM < cfg.data_inicio) return false;
      return true;
    }
    return monthsBetween(lastData.substring(0, 7) + '-01', firstDayOfM) <= 24;
  };
  const baseTxs = transacoes.data || [];
  const thisMonthDescs = new Set(baseTxs.filter((t: any) => t.tipo === 'fixa').map((t: any) => norm(t.descricao)));
  const projMap = new Map<string, any>();
  for (const f of (prevFixasRes.data || [])) {
    const key = (f.descricao || '').toLowerCase();
    if (!thisMonthDescs.has(key) && !projMap.has(key) && shouldProject(f.descricao || '', f.data)) {
      projMap.set(key, { ...f, id: null, projetado: true, data: firstDayOfM, fatura_ano: ano, fatura_mes: mes });
    }
  }

  // Exclui parcelados PIX/dinheiro do mês atual — eles pertencem à fatura do mês anterior
  const allTxs = [...baseTxs, ...Array.from(projMap.values())];
  const txs = allTxs.filter((t: any) => !(t.tipo === 'parcelada' && !t.cartao_id));
  const pixNext = pixParceladosNext.data || [];

  const sumBy = (arr: any[], filter: (t: any) => boolean) =>
    arr.filter(filter).reduce((s: number, t: any) => s + Number(t.valor), 0);

  const pixNextTotal = pixNext.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const total = txs.reduce((s: number, t: any) => s + Number(t.valor), 0) + pixNextTotal;
  const renda = Number(meses.data?.renda || 0);

  const porCartao = (cartoes.data || [])
    .map((c: any) => ({
      ...c,
      total: sumBy(txs, t => t.cartao_id === c.id),
    }))
    .sort((a: any, b: any) => b.total - a.total);

  const pixTotal = sumBy(txs, t => t.meio_pagamento === 'pix')
    + sumBy(pixNext, t => t.meio_pagamento === 'pix');
  const dinheiroTotal = sumBy(txs, t => t.meio_pagamento === 'dinheiro')
    + sumBy(pixNext, t => t.meio_pagamento === 'dinheiro');
  const semCartaoTotal = sumBy(txs, t => !t.cartao_id && !t.meio_pagamento)
    + sumBy(pixNext, t => !t.cartao_id && !t.meio_pagamento);

  if (pixTotal > 0) porCartao.push({ id: 'pix', nome: 'Pix', cor: '#00b8d4', total: pixTotal });
  if (dinheiroTotal > 0) porCartao.push({ id: 'dinheiro', nome: 'Dinheiro', cor: '#6edab4', total: dinheiroTotal });
  if (semCartaoTotal > 0) porCartao.push({ id: 'sem_cartao', nome: 'Sem cartão', cor: '#908fa0', total: semCartaoTotal });

  const porTipo = {
    fixa:      sumBy(txs, t => t.tipo === 'fixa'),
    parcelada: sumBy(txs, t => t.tipo === 'parcelada') + pixNextTotal,
    avulsa:    sumBy(txs, t => t.tipo === 'avulsa'),
  };

  const catMap: Record<number, any> = {};
  [...txs, ...pixNext].forEach((t: any) => {
    if (!t.categoria_id) return;
    if (!catMap[t.categoria_id]) catMap[t.categoria_id] = { ...t.categorias, total: 0 };
    catMap[t.categoria_id].total += Number(t.valor);
  });
  const porCategoria = Object.values(catMap).sort((a: any, b: any) => b.total - a.total).slice(0, 8);

  const parcelasAbertas = [
    ...txs.filter((t: any) => t.tipo === 'parcelada'),
    ...pixNext,
  ];
  const fixasDoMes = txs
    .filter((t: any) => t.tipo === 'fixa')
    .sort((a: any, b: any) => a.descricao.localeCompare(b.descricao));

  return NextResponse.json({
    total, renda, saldo: renda - total,
    quantidade: txs.length + pixNext.length,
    porCartao, porTipo, porCategoria, parcelasAbertas, fixasDoMes,
    pixParceladosDoMes: pixNextTotal,
  });
}
