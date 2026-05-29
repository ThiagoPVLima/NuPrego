import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.from('fixas_config').select('*');
    if (error) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descricao, ativa, data_inicio } = body;

  try {
    const { data: existing } = await supabase
      .from('fixas_config')
      .select('id')
      .ilike('descricao', descricao)
      .maybeSingle();

    const payload: Record<string, unknown> = { ativa };
    if ('data_inicio' in body) payload.data_inicio = data_inicio ?? null;

    let result;
    if (existing) {
      result = await supabase
        .from('fixas_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('fixas_config')
        .insert({ descricao, ...payload })
        .select()
        .single();
    }

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json(result.data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
