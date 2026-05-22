import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get('mes');
  const cartao_id = searchParams.get('cartao_id');
  const tipo = searchParams.get('tipo');
  const busca = searchParams.get('busca');

  let query = supabase
    .from('transacoes')
    .select('*, cartoes(id,nome,cor), categorias(id,nome,icone,cor)')
    .order('data', { ascending: false })
    .order('id', { ascending: false });

  if (mes) {
    const [ano, m] = mes.split('-');
    const start = `${ano}-${m}-01`;
    const end = new Date(parseInt(ano), parseInt(m), 0).toISOString().split('T')[0];
    query = query.gte('data', start).lte('data', end);
  }
  if (cartao_id) query = query.eq('cartao_id', cartao_id);
  if (tipo) query = query.eq('tipo', tipo);
  if (busca) query = query.ilike('descricao', `%${busca}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descricao, valor, data, tipo, cartao_id, categoria_id, total_parcelas } = body;

  if (tipo === 'parcelada' && total_parcelas > 1) {
    const grupo = randomUUID();
    const valorParcela = Math.round((valor / total_parcelas) * 100) / 100;
    const inserts = [];
    const dataBase = new Date(data + 'T12:00:00');

    for (let i = 1; i <= total_parcelas; i++) {
      const d = new Date(dataBase);
      d.setMonth(d.getMonth() + (i - 1));
      inserts.push({
        descricao: `${descricao} ${i}/${total_parcelas}`,
        valor: valorParcela,
        data: d.toISOString().split('T')[0],
        tipo, cartao_id: cartao_id || null,
        categoria_id: categoria_id || null,
        parcela_atual: i, total_parcelas, grupo_parcela: grupo,
      });
    }
    const { error } = await supabase.from('transacoes').insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, grupo });
  }

  const { data: row, error } = await supabase.from('transacoes').insert({
    descricao, valor, data, tipo,
    cartao_id: cartao_id || null,
    categoria_id: categoria_id || null,
    parcela_atual: 1, total_parcelas: 1,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}
