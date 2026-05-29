import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Reverte fatura_ano/fatura_mes de parceladas PIX/dinheiro de volta ao mês da data.
// Aplica apenas onde fatura_mes = mês da data - 1 (registros que foram deslocados).
export async function POST() {
  const { data: txs, error } = await supabase
    .from('transacoes')
    .select('id, data, fatura_ano, fatura_mes')
    .eq('tipo', 'parcelada')
    .is('cartao_id', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let updated = 0;
  for (const t of txs || []) {
    const dataAno = parseInt(t.data.substring(0, 4));
    const dataMes = parseInt(t.data.substring(5, 7));
    const faturaEsperadaAno = dataMes === 1 ? dataAno - 1 : dataAno;
    const faturaEsperadaMes = dataMes === 1 ? 12 : dataMes - 1;
    if (t.fatura_ano === faturaEsperadaAno && t.fatura_mes === faturaEsperadaMes) {
      const { error: updErr } = await supabase
        .from('transacoes')
        .update({ fatura_ano: dataAno, fatura_mes: dataMes })
        .eq('id', t.id);
      if (!updErr) updated++;
    }
  }

  return NextResponse.json({ updated, total: (txs || []).length });
}
