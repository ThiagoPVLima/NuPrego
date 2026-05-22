import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();

  const { error } = await supabase
    .from('categorias')
    .update({ nome: body.nome, icone: body.icone || null, cor: body.cor || '#8083ff' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numId = parseInt(id);

  // Remove da lista de categoria_ids em todas as transações
  const { data: txs } = await supabase
    .from('transacoes')
    .select('id, categoria_ids')
    .contains('categoria_ids', [numId]);

  if (txs?.length) {
    for (const tx of txs) {
      const novosIds = (tx.categoria_ids as number[]).filter((x: number) => x !== numId);
      await supabase.from('transacoes').update({
        categoria_ids: novosIds,
        categoria_id: novosIds[0] ?? null,
      }).eq('id', tx.id);
    }
  }

  // Desvincula categoria_id legado
  await supabase.from('transacoes').update({ categoria_id: null }).eq('categoria_id', numId);

  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
