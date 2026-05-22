import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcFatura } from '@/lib/billing';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get('mes');
  const cartao_id = searchParams.get('cartao_id');
  const tipo = searchParams.get('tipo');
  const busca = searchParams.get('busca');
  const meio = searchParams.get('meio');
  const categoria_id = searchParams.get('categoria_id');

  let query = supabase
    .from('transacoes')
    .select('*, cartoes(id,nome,cor), categorias(id,nome,icone,cor)')
    .order('data', { ascending: false })
    .order('id', { ascending: false });

  if (mes) {
    const [ano, m] = mes.split('-');
    query = query.eq('fatura_ano', parseInt(ano)).eq('fatura_mes', parseInt(m));
  }
  if (cartao_id) query = query.eq('cartao_id', cartao_id);
  if (tipo) query = query.eq('tipo', tipo);
  if (busca) query = query.ilike('descricao', `%${busca}%`);
  if (meio) query = query.eq('meio_pagamento', meio);
  if (categoria_id) query = query.contains('categoria_ids', [parseInt(categoria_id)]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

async function getFechamento(cartao_id: number | null): Promise<number | null> {
  if (!cartao_id) return null;
  const { data } = await supabase.from('cartoes').select('fechamento').eq('id', cartao_id).single();
  return data?.fechamento ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descricao, valor, data, tipo, cartao_id, categoria_ids, total_parcelas, meio_pagamento } = body;
  const catIds: number[] = Array.isArray(categoria_ids) ? categoria_ids : [];
  const catId = catIds[0] ?? null;
  const fechamento = await getFechamento(cartao_id || null);

  if (tipo === 'parcelada' && total_parcelas > 1) {
    const grupo = randomUUID();
    const valorParcela = Math.round((valor / total_parcelas) * 100) / 100;
    const inserts = [];
    const dataBase = new Date(data + 'T12:00:00');

    for (let i = 1; i <= total_parcelas; i++) {
      const d = new Date(dataBase);
      d.setMonth(d.getMonth() + (i - 1));
      const dataStr = d.toISOString().split('T')[0];
      const { fatura_ano, fatura_mes } = calcFatura(dataStr, fechamento);
      inserts.push({
        descricao: `${descricao} ${i}/${total_parcelas}`,
        valor: valorParcela,
        data: dataStr,
        tipo,
        cartao_id: cartao_id || null,
        categoria_id: catId,
        categoria_ids: catIds,
        meio_pagamento: meio_pagamento || null,
        parcela_atual: i, total_parcelas, grupo_parcela: grupo,
        fatura_ano, fatura_mes,
      });
    }
    const { error } = await supabase.from('transacoes').insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, grupo });
  }

  const { fatura_ano, fatura_mes } = calcFatura(data, fechamento);

  const { data: row, error } = await supabase.from('transacoes').insert({
    descricao, valor, data, tipo,
    cartao_id: cartao_id || null,
    categoria_id: catId,
    categoria_ids: catIds,
    meio_pagamento: meio_pagamento || null,
    parcela_atual: 1, total_parcelas: 1,
    fatura_ano, fatura_mes,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}
