import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') || '';
  if (q.length < 1) return NextResponse.json([]);

  const { data } = await supabase
    .from('transacoes')
    .select('descricao, valor, tipo, meio_pagamento, cartao_id, categoria_id, categoria_ids, data')
    .ilike('descricao', `%${q}%`)
    .order('data', { ascending: false })
    .limit(300);

  const seen = new Set<string>();
  const results: typeof data = [];
  for (const row of data || []) {
    const key = row.descricao.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(row);
    }
    if (results.length >= 8) break;
  }

  return NextResponse.json(results);
}
