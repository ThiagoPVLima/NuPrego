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

  if (searchParams.get('pago_grupo')) {
    const { grupo_parcela } = body as { grupo_parcela: string };

    // Carrega todas as parcelas existentes do grupo
    const { data: rows, error: fetchErr } = await supabase
      .from('transacoes')
      .select('id, parcela_atual, total_parcelas, data, descricao, valor, cartao_id, categoria_id, categoria_ids, meio_pagamento')
      .eq('grupo_parcela', grupo_parcela)
      .order('parcela_atual', { ascending: true });
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // Marca todas existentes como pagas
    const { error } = await supabase.from('transacoes').update({ pago: true }).eq('grupo_parcela', grupo_parcela);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Cria parcelas faltantes se o grupo está incompleto
    if (rows && rows.length > 0) {
      const totalParcelas = rows[0].total_parcelas as number;
      if (rows.length < totalParcelas) {
        const existingNums = new Set(rows.map((r: { parcela_atual: number }) => r.parcela_atual));
        const refRow = rows[0];
        const descBase = (refRow.descricao as string).replace(/ \d+\/\d+$/, '');
        const grupoFechamento = await getFechamento((refRow.cartao_id as number) || null);
        // Calcula data da 1ª parcela retrocedendo a partir da mais antiga existente
        const refDate = new Date((refRow.data as string) + 'T12:00:00');
        const baseYear = refDate.getFullYear();
        const baseMonth = refDate.getMonth() - ((refRow.parcela_atual as number) - 1);
        const baseDay = refDate.getDate();

        const toInsert: Record<string, unknown>[] = [];
        for (let i = 1; i <= totalParcelas; i++) {
          if (existingNums.has(i)) continue;
          const targetMonth = baseMonth + (i - 1);
          const targetYear = baseYear + Math.floor(targetMonth / 12);
          const normalizedMonth = ((targetMonth % 12) + 12) % 12;
          const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
          const day = Math.min(baseDay, lastDay);
          const d = new Date(targetYear, normalizedMonth, day, 12, 0, 0);
          const dataStr = d.toISOString().split('T')[0];
          const { fatura_ano, fatura_mes } = calcFatura(dataStr, grupoFechamento);
          toInsert.push({
            descricao: `${descBase} ${i}/${totalParcelas}`,
            valor: refRow.valor,
            data: dataStr,
            tipo: 'parcelada',
            cartao_id: refRow.cartao_id,
            categoria_id: refRow.categoria_id,
            categoria_ids: refRow.categoria_ids,
            meio_pagamento: refRow.meio_pagamento,
            parcela_atual: i,
            total_parcelas: totalParcelas,
            grupo_parcela: grupo_parcela,
            fatura_ano, fatura_mes,
            pago: true,
          });
        }
        if (toInsert.length) {
          const { error: insertErr } = await supabase.from('transacoes').insert(toInsert);
          if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }
      }
    }
    return NextResponse.json({ success: true });
  }

  if (searchParams.get('pago_fixas')) {
    const { data: thisTx } = await supabase.from('transacoes').select('*').eq('id', id).single();
    if (!thisTx) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    // Busca todas as entradas existentes para esta fixa
    const { data: allEntries, error: fetchErr } = await supabase
      .from('transacoes')
      .select('data')
      .eq('tipo', 'fixa')
      .eq('descricao', thisTx.descricao)
      .order('data', { ascending: true });
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    // Marca todas existentes como pagas
    const { error: updateErr } = await supabase
      .from('transacoes')
      .update({ pago: true })
      .eq('tipo', 'fixa')
      .eq('descricao', thisTx.descricao);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Determina data de início: fixas_config ou entrada mais antiga
    let dataInicio: string | null = null;
    try {
      const { data: cfgRow } = await supabase
        .from('fixas_config')
        .select('data_inicio')
        .ilike('descricao', thisTx.descricao)
        .single();
      dataInicio = cfgRow?.data_inicio ?? null;
    } catch { /* tabela pode não existir */ }
    if (!dataInicio && allEntries?.length) dataInicio = allEntries[0].data;
    if (!dataInicio) return NextResponse.json({ success: true });

    // Cria entradas nos meses faltantes (do início até o mês atual)
    const existingMonths = new Set((allEntries || []).map((e: { data: string }) => e.data.substring(0, 7)));
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fixaFechamento = await getFechamento(thisTx.cartao_id || null);
    const toInsert: Record<string, unknown>[] = [];
    let cursor = dataInicio.substring(0, 7);
    while (cursor <= currentYM) {
      if (!existingMonths.has(cursor)) {
        const dataStr = `${cursor}-01`;
        const { fatura_ano, fatura_mes } = calcFatura(dataStr, fixaFechamento);
        toInsert.push({
          descricao: thisTx.descricao,
          valor: thisTx.valor,
          data: dataStr,
          tipo: 'fixa',
          cartao_id: thisTx.cartao_id,
          categoria_id: thisTx.categoria_id,
          categoria_ids: thisTx.categoria_ids,
          meio_pagamento: thisTx.meio_pagamento,
          fatura_ano, fatura_mes,
          pago: true,
        });
      }
      const [y, m] = cursor.split('-').map(Number);
      const next = new Date(y, m, 1);
      cursor = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    }
    if (toInsert.length) {
      const { error: insertErr } = await supabase.from('transacoes').insert(toInsert);
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
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
