import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';

// POST /api/migrar-grupos
// Atribui grupo_parcela para transações parceladas importadas sem um.
// Agrupa por descrição-base + cartao_id + total_parcelas.
// Chame UMA VEZ para corrigir dados históricos.
export async function POST() {
  const { data: txs, error } = await supabase
    .from('transacoes')
    .select('id, descricao, cartao_id, total_parcelas')
    .eq('tipo', 'parcelada')
    .is('grupo_parcela', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!txs?.length) return NextResponse.json({ atualizadas: 0, mensagem: 'Nenhuma transação sem grupo encontrada' });

  // Monta mapa: chave → { grupo_uuid, ids[] }
  const grupoMap = new Map<string, { uuid: string; ids: number[] }>();
  for (const t of txs) {
    const base = t.descricao.replace(/ \d+\/\d+$/, '');
    const chave = `${base}|${t.cartao_id ?? 'null'}|${t.total_parcelas}`;
    if (!grupoMap.has(chave)) {
      const hash = createHash('md5').update(chave).digest('hex');
      const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
      grupoMap.set(chave, { uuid, ids: [] });
    }
    grupoMap.get(chave)!.ids.push(t.id);
  }

  // Um UPDATE por grupo: UPDATE transacoes SET grupo_parcela = X WHERE id IN (...)
  let atualizadas = 0;
  for (const { uuid, ids } of grupoMap.values()) {
    const { error: upErr } = await supabase
      .from('transacoes')
      .update({ grupo_parcela: uuid })
      .in('id', ids);
    if (upErr) return NextResponse.json({ error: upErr.message, atualizadas }, { status: 500 });
    atualizadas += ids.length;
  }

  return NextResponse.json({
    atualizadas,
    grupos: grupoMap.size,
    mensagem: `${atualizadas} parcelas agrupadas em ${grupoMap.size} compras`,
  });
}
