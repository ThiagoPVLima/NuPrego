import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ano = searchParams.get('ano');
  let query = supabase.from('meses').select('*').order('ano', { ascending: false }).order('mes', { ascending: false });
  if (ano) query = query.eq('ano', ano);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { ano, mes, renda, observacoes } = await req.json();
  const { error } = await supabase.from('meses').upsert({ ano, mes, renda, observacoes }, { onConflict: 'ano,mes' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
