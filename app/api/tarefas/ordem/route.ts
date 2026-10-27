import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.some(id => !Number.isInteger(id))) {
    return NextResponse.json({ error: 'ids invalidos' }, { status: 400 });
  }

  const resultados = await Promise.all(
    ids.map((id: number, i: number) => supabase.from('tarefas').update({ ordem: i + 1 }).eq('id', id))
  );
  const falha = resultados.find(r => r.error);
  if (falha?.error) return NextResponse.json({ error: falha.error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
