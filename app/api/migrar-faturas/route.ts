import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcFatura } from '@/lib/billing';

const BATCH = 1000;

export async function POST() {
  const { data: cartoes } = await supabase.from('cartoes').select('id, fechamento');
  const fechamentoMap: Record<number, number | null> = {};
  for (const c of cartoes || []) fechamentoMap[c.id] = c.fechamento ?? null;

  let offset = 0;
  let atualizadas = 0;

  while (true) {
    const { data: txs, error: txErr } = await supabase
      .from('transacoes')
      .select('id, data, cartao_id')
      .range(offset, offset + BATCH - 1);

    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
    if (!txs?.length) break;

    for (const tx of txs) {
      const fechamento = tx.cartao_id ? (fechamentoMap[tx.cartao_id] ?? null) : null;
      const { fatura_ano, fatura_mes } = calcFatura(tx.data, fechamento);
      const { error } = await supabase
        .from('transacoes')
        .update({ fatura_ano, fatura_mes })
        .eq('id', tx.id);
      if (error) return NextResponse.json({ error: error.message, id: tx.id }, { status: 500 });
      atualizadas++;
    }

    if (txs.length < BATCH) break;
    offset += BATCH;
  }

  return NextResponse.json({ success: true, atualizadas });
}
