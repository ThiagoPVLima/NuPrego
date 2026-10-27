import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { LIMITE_AGORA } from '@/lib/tarefas';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .order('ordem')
    .order('criado_em', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { titulo, estado = 'inbox', contexto = null, data_limite = null } = await req.json();
  if (!titulo?.trim()) return NextResponse.json({ error: 'titulo obrigatorio' }, { status: 400 });

  if (estado === 'agora') {
    const { count } = await supabase.from('tarefas').select('id', { count: 'exact', head: true }).eq('estado', 'agora');
    if ((count ?? 0) >= LIMITE_AGORA) {
      return NextResponse.json({ error: `Agora aceita no maximo ${LIMITE_AGORA}` }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from('tarefas')
    .insert({ titulo: titulo.trim(), estado, contexto, data_limite })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
