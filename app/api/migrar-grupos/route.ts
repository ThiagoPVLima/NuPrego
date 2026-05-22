import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';

// POST /api/migrar-grupos
// Atribui grupo_parcela para transações parceladas importadas que não têm um.
// Agrupa por descrição-base + cartao_id + total_parcelas.
// Chame UMA VEZ para corrigir dados históricos.
export async function POST() {
  // Busca todas as parceladas sem grupo
  const { data: txs, error } = await supabase
    .from('transacoes')
    .select('id, descricao, cartao_id, total_parcelas')
    .eq('tipo', 'parcelada')
    .is('grupo_parcela', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!txs?.length) return NextResponse.json({ atualizadas: 0, mensagem: 'Nenhuma transação sem grupo encontrada' });

  // Gera um UUID determinístico por (descricao-base, cartao_id, total_parcelas)
  const grupoMap = new Map<string, string>();
  const updates = txs.map(t => {
    const base = t.descricao.replace(/ \d+\/\d+$/, '');
    const chave = `${base}|${t.cartao_id ?? 'null'}|${t.total_parcelas}`;
    if (!grupoMap.has(chave)) {
      // Gera UUID v4-like a partir do hash da chave
      const hash = createHash('md5').update(chave).digest('hex');
      const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
      grupoMap.set(chave, uuid);
    }
    return { id: t.id, grupo_parcela: grupoMap.get(chave)! };
  });

  // Atualiza em lotes de 500
  let atualizadas = 0;
  const loteSize = 500;
  for (let i = 0; i < updates.length; i += loteSize) {
    const lote = updates.slice(i, i + loteSize);
    const { error: upErr } = await supabase.from('transacoes').upsert(lote);
    if (upErr) return NextResponse.json({ error: upErr.message, atualizadas }, { status: 500 });
    atualizadas += lote.length;
  }

  return NextResponse.json({
    atualizadas,
    grupos: grupoMap.size,
    mensagem: `${atualizadas} parcelas agrupadas em ${grupoMap.size} compras`,
  });
}
