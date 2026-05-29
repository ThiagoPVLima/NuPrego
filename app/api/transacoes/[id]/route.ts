import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcFatura, shiftFaturaBack } from '@/lib/billing';

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

  // ── Fixas bulk update ──
  const fixasDsde = searchParams.get('fixas_desde');
  const fixasTodos = searchParams.get('fixas_todos');

  if (searchParams.get('adiantar')) {
    const hoje = new Date().toISOString().split('T')[0];
    const { data: tx } = await supabase.from('transacoes').select('cartao_id').eq('id', id).single();
    const fechamento = await getFechamento(tx?.cartao_id ?? null);
    const { fatura_ano, fatura_mes } = calcFatura(hoje, fechamento);
    const { error } = await supabase.from('transacoes').update({ data: hoje, fatura_ano, fatura_mes, pago: true }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (searchParams.get('pago_only')) {
    const { error } = await supabase.from('transacoes').update({ pago: body.pago }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (fixasDsde || fixasTodos) {
    const { data: thisTx } = await supabase.from('transacoes').select('descricao').eq('id', id).single();
    if (!thisTx) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    let matchQ = supabase.from('transacoes').select('id, data').eq('tipo', 'fixa').eq('descricao', thisTx.descricao);
    if (fixasDsde) matchQ = matchQ.gte('data', fixasDsde);

    const { data: matches, error: matchErr } = await matchQ;
    if (matchErr) return NextResponse.json({ error: matchErr.message }, { status: 500 });

    const descAtualizada = body.descricao && body.descricao !== thisTx.descricao ? body.descricao : null;

    for (const m of matches || []) {
      const { fatura_ano, fatura_mes } = calcFatura(m.data, fechamento);
      const upd: Record<string, unknown> = {
        valor: body.valor,
        cartao_id: body.cartao_id || null,
        categoria_id: catId,
        categoria_ids: catIds,
        meio_pagamento: body.meio_pagamento || null,
        fatura_ano, fatura_mes,
      };
      if (descAtualizada) upd.descricao = descAtualizada;
      const { error: updErr } = await supabase.from('transacoes').update(upd).eq('id', m.id);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

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
      const rawFatura = calcFatura(dataParaFatura, fechamento);
      const { fatura_ano, fatura_mes } = !body.cartao_id ? shiftFaturaBack(rawFatura.fatura_ano, rawFatura.fatura_mes) : rawFatura;
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
  const fixasDsde = searchParams.get('fixas_desde');
  const fixasTodos = searchParams.get('fixas_todos');

  if (grupo) {
    const { error } = await supabase.from('transacoes').delete().eq('grupo_parcela', grupo);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (fixasDsde || fixasTodos) {
    const { data: thisTx } = await supabase.from('transacoes').select('descricao').eq('id', id).single();
    if (!thisTx) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    let delQ = supabase.from('transacoes').delete().eq('tipo', 'fixa').eq('descricao', thisTx.descricao);
    if (fixasDsde) delQ = delQ.gte('data', fixasDsde);

    const { error } = await delQ;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from('transacoes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
