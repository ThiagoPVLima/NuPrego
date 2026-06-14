import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from('cartoes').select('*').eq('ativo', true).order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const body = await req.json();
  const { data, error } = await supabase.from('cartoes').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
