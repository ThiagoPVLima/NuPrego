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

  // Desvincula transações antes de deletar (evita violação de FK)
  const { error: unlinkErr } = await supabase
    .from('transacoes')
    .update({ categoria_id: null })
    .eq('categoria_id', id);
  if (unlinkErr) return NextResponse.json({ error: unlinkErr.message }, { status: 500 });

  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
