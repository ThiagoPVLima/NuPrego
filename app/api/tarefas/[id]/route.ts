import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { LIMITE_AGORA } from '@/lib/tarefas';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { id } = await context.params;
  const { titulo, estado, contexto, data_limite, ordem } = await req.json();

  const patch: Record<string, unknown> = {};
  if (titulo !== undefined) patch.titulo = titulo;
  if (contexto !== undefined) patch.contexto = contexto;
  if (data_limite !== undefined) patch.data_limite = data_limite;
  if (ordem !== undefined) patch.ordem = ordem;
  if (estado !== undefined) {
    patch.estado = estado;
    patch.concluido_em = estado === 'feito' ? new Date().toISOString() : null;
  }

  if (estado === 'agora') {
    const { count } = await supabase
      .from('tarefas')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'agora')
      .neq('id', id);
    if ((count ?? 0) >= LIMITE_AGORA) {
      return NextResponse.json({ error: `Agora aceita no maximo ${LIMITE_AGORA}` }, { status: 409 });
    }
  }

  const { error } = await supabase.from('tarefas').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { id } = await context.params;
  const { error } = await supabase.from('tarefas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
