import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const { error } = await supabase.from('transacoes').update({
    descricao: body.descricao, valor: body.valor, data: body.data,
    tipo: body.tipo, cartao_id: body.cartao_id || null, categoria_id: body.categoria_id || null,
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
