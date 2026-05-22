import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const { searchParams } = new URL(req.url);
  const grupo = searchParams.get('grupo');

  if (grupo) {
    const { data: rows, error: fetchError } = await supabase
      .from('transacoes')
      .select('id, parcela_atual, total_parcelas')
      .eq('grupo_parcela', grupo);

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!rows?.length) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });

    const updates = rows.map((r) => ({
      id: r.id,
      descricao: `${body.descricao} ${r.parcela_atual}/${r.total_parcelas}`,
      valor: body.valor,
      cartao_id: body.cartao_id || null,
      categoria_id: body.categoria_id || null,
      meio_pagamento: body.meio_pagamento || null,
    }));

    const { error } = await supabase.from('transacoes').upsert(updates);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from('transacoes').update({
    descricao: body.descricao,
    valor: body.valor,
    data: body.data,
    tipo: body.tipo,
    cartao_id: body.cartao_id || null,
    categoria_id: body.categoria_id || null,
    meio_pagamento: body.meio_pagamento || null,
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
