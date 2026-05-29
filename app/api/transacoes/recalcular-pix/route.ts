import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { shiftFaturaBack } from '@/lib/billing';

// Corrige fatura_ano/fatura_mes de parceladas PIX/dinheiro existentes.
// Aplica apenas onde fatura_mes = mês da data (ainda não foi deslocado).
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
    if (t.fatura_ano === dataAno && t.fatura_mes === dataMes) {
      const { fatura_ano, fatura_mes } = shiftFaturaBack(t.fatura_ano, t.fatura_mes);
      const { error: updErr } = await supabase
        .from('transacoes')
        .update({ fatura_ano, fatura_mes })
        .eq('id', t.id);
      if (!updErr) updated++;
    }
  }

  return NextResponse.json({ updated, total: (txs || []).length });
}
