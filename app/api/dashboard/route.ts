import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ano = parseInt(searchParams.get('ano') || String(new Date().getFullYear()));
  const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));

  const start = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const end = new Date(ano, mes, 0).toISOString().split('T')[0];

  const [transacoes, cartoes, meses, categorias] = await Promise.all([
    supabase.from('transacoes').select('*, cartoes(id,nome,cor), categorias(id,nome,cor)')
      .gte('data', start).lte('data', end),
    supabase.from('cartoes').select('*').eq('ativo', true).order('id'),
    supabase.from('meses').select('*').eq('ano', ano).eq('mes', mes).single(),
    supabase.from('categorias').select('*'),
  ]);

  const txs = transacoes.data || [];
  const total = txs.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const renda = Number(meses.data?.renda || 0);

  // Por cartão
  const porCartao = (cartoes.data || []).map((c: any) => ({
    ...c,
    total: txs.filter((t: any) => t.cartao_id === c.id).reduce((s: number, t: any) => s + Number(t.valor), 0),
  })).sort((a: any, b: any) => b.total - a.total);

  // Por tipo
  const porTipo = {
    fixa: txs.filter((t: any) => t.tipo === 'fixa').reduce((s: number, t: any) => s + Number(t.valor), 0),
    parcelada: txs.filter((t: any) => t.tipo === 'parcelada').reduce((s: number, t: any) => s + Number(t.valor), 0),
    avulsa: txs.filter((t: any) => t.tipo === 'avulsa').reduce((s: number, t: any) => s + Number(t.valor), 0),
  };

  // Por categoria
  const catMap: Record<number, any> = {};
  txs.forEach((t: any) => {
    if (!t.categoria_id) return;
    if (!catMap[t.categoria_id]) catMap[t.categoria_id] = { ...t.categorias, total: 0 };
    catMap[t.categoria_id].total += Number(t.valor);
  });
  const porCategoria = Object.values(catMap).sort((a: any, b: any) => b.total - a.total).slice(0, 8);

  // Parcelas do mês
  const parcelasAbertas = txs.filter((t: any) => t.tipo === 'parcelada');

  return NextResponse.json({
    total, renda, saldo: renda - total,
    quantidade: txs.length,
    porCartao, porTipo, porCategoria, parcelasAbertas,
  });
}
