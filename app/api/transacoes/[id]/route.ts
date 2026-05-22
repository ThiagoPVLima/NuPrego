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
      .select('id, descricao, parcela_atual, total_parcelas')
      .eq('grupo_parcela', grupo);

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!rows?.length) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });

    // Atualiza campos compartilhados de uma vez (evita upsert com ID serial)
    const { error: sharedErr } = await supabase
      .from('transacoes')
      .update({
        valor: body.valor,
        cartao_id: body.cartao_id || null,
        categoria_id: body.categoria_id || null,
        meio_pagamento: body.meio_pagamento || null,
      })
      .eq('grupo_parcela', grupo);
    if (sharedErr) return NextResponse.json({ error: sharedErr.message }, { status: 500 });

    // Atualiza descrição individualmente só se mudou
    const baseAtual = rows[0].descricao.replace(/ \d+\/\d+$/, '');
    if (body.descricao !== baseAtual) {
      for (const r of rows) {
        const { error: descErr } = await supabase
          .from('transacoes')
          .update({ descricao: `${body.descricao} ${r.parcela_atual}/${r.total_parcelas}` })
          .eq('id', r.id);
        if (descErr) return NextResponse.json({ error: descErr.message }, { status: 500 });
      }
    }

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
