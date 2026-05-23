import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcFatura } from '@/lib/billing';

async function getFechamento(cartao_id: number | null): Promise<number | null> {
  if (!cartao_id) return null;
  const { data } = await supabase.from('cartoes').select('fechamento').eq('id', cartao_id).single();
  return data?.fechamento ?? null;
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const { searchParams } = new URL(req.url);
  const grupo = searchParams.get('grupo');

  const catIds: number[] = Array.isArray(body.categoria_ids) ? body.categoria_ids : [];
  const catId = catIds[0] ?? null;
  const fechamento = await getFechamento(body.cartao_id || null);

  if (grupo) {
    const { data: rows, error: fetchError } = await supabase
      .from('transacoes')
      .select('id, descricao, parcela_atual, total_parcelas, data')
      .eq('grupo_parcela', grupo);

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!rows?.length) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });

    // Update shared fields
    const { error: sharedErr } = await supabase
      .from('transacoes')
      .update({
        valor: body.valor,
        cartao_id: body.cartao_id || null,
        categoria_id: catId,
        categoria_ids: catIds,
        meio_pagamento: body.meio_pagamento || null,
      })
      .eq('grupo_parcela', grupo);
    if (sharedErr) return NextResponse.json({ error: sharedErr.message }, { status: 500 });

    const baseAtual = rows[0].descricao.replace(/ \d+\/\d+$/, '');
    const descMudou = body.descricao !== undefined && body.descricao !== baseAtual;
    const dataBase = body.data_inicio ? new Date(body.data_inicio + 'T12:00:00') : null;

    // Per-row: date shift + billing month + description
    for (const r of rows) {
      const update: Record<string, unknown> = {};

      if (dataBase) {
        const d = new Date(dataBase);
        d.setMonth(d.getMonth() + (r.parcela_atual - 1));
        update.data = d.toISOString().split('T')[0];
      }

      const dataParaFatura = (update.data as string) || r.data;
      const { fatura_ano, fatura_mes } = calcFatura(dataParaFatura, fechamento);
      update.fatura_ano = fatura_ano;
      update.fatura_mes = fatura_mes;

      if (descMudou) {
        update.descricao = `${body.descricao} ${r.parcela_atual}/${r.total_parcelas}`;
      }

      const { error: rowErr } = await supabase.from('transacoes').update(update).eq('id', r.id);
      if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  const { fatura_ano, fatura_mes } = calcFatura(body.data, fechamento);

  const { error } = await supabase.from('transacoes').update({
    descricao: body.descricao,
    valor: body.valor,
    data: body.data,
    tipo: body.tipo,
    cartao_id: body.cartao_id || null,
    categoria_id: catId,
    categoria_ids: catIds,
    meio_pagamento: body.meio_pagamento || null,
    fatura_ano,
    fatura_mes,
  }).eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const grupo = searchParams.get('grupo');

  if (grupo) {
    const { error } = await supabase.from('transacoes').delete().eq('grupo_parcela', grupo);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from('transacoes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
