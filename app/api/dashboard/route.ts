import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()));
  const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));

  const [transacoes, cartoes, meses] = await Promise.all([
    supabase.from('transacoes')
      .select('*, cartoes(id,nome,cor), categorias(id,nome,cor)')
      .eq('fatura_ano', ano).eq('fatura_mes', mes),
    supabase.from('cartoes').select('*').eq('ativo', true).order('id'),
    supabase.from('meses').select('*').eq('ano', ano).eq('mes', mes).single(),
  ]);

  const txs = transacoes.data || [];
  const total = txs.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const renda = Number(meses.data?.renda || 0);

  const porCartao = (cartoes.data || [])
    .map((c: any) => ({
      ...c,
      total: txs
        .filter((t: any) => t.cartao_id === c.id)
        .reduce((s: number, t: any) => s + Number(t.valor), 0),
    }))
    .sort((a: any, b: any) => b.total - a.total);

  const pixTotal = txs
    .filter((t: any) => t.meio_pagamento === 'pix')
    .reduce((s: number, t: any) => s + Number(t.valor), 0);
  const dinheiroTotal = txs
    .filter((t: any) => t.meio_pagamento === 'dinheiro')
    .reduce((s: number, t: any) => s + Number(t.valor), 0);
  const semCartaoTotal = txs
    .filter((t: any) => !t.cartao_id && !t.meio_pagamento)
    .reduce((s: number, t: any) => s + Number(t.valor), 0);

  if (pixTotal > 0) porCartao.push({ id: 'pix', nome: 'Pix', cor: '#00b8d4', total: pixTotal });
  if (dinheiroTotal > 0) porCartao.push({ id: 'dinheiro', nome: 'Dinheiro', cor: '#6edab4', total: dinheiroTotal });
  if (semCartaoTotal > 0) porCartao.push({ id: 'sem_cartao', nome: 'Sem cartão', cor: '#908fa0', total: semCartaoTotal });

  const porTipo = {
    fixa:      txs.filter((t: any) => t.tipo === 'fixa').reduce((s: number, t: any) => s + Number(t.valor), 0),
    parcelada: txs.filter((t: any) => t.tipo === 'parcelada').reduce((s: number, t: any) => s + Number(t.valor), 0),
    avulsa:    txs.filter((t: any) => t.tipo === 'avulsa').reduce((s: number, t: any) => s + Number(t.valor), 0),
  };

  const catMap: Record<number, any> = {};
  txs.forEach((t: any) => {
    if (!t.categoria_id) return;
    if (!catMap[t.categoria_id]) catMap[t.categoria_id] = { ...t.categorias, total: 0 };
    catMap[t.categoria_id].total += Number(t.valor);
  });
  const porCategoria = Object.values(catMap).sort((a: any, b: any) => b.total - a.total).slice(0, 8);

  const parcelasAbertas = txs.filter((t: any) => t.tipo === 'parcelada');

  return NextResponse.json({
    total, renda, saldo: renda - total,
    quantidade: txs.length,
    porCartao, porTipo, porCategoria, parcelasAbertas,
  });
}
