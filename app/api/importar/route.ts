import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

const MESES_PT: Record<string, number> = {
  janeiro:1,fevereiro:2,'março':3,abril:4,maio:5,junho:6,
  julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12,
};
const CARTAO_MAP: Record<string, number> = {
  'cartão itaú':1,'itaú':1,'cartao itau':1,
  'cartão mercado livre':2,'mercado livre':2,
  'cartão monique':3,'monique':3,
  'cartão padrinho':4,'padrinho':4,
};

function parseVal(v: unknown): number | null {
  if (!v) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',','.'));
  return !isNaN(n) && n > 0 ? n : null;
}

function parseDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    return d ? `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}` : null;
  }
  const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? String(v).substring(0,10) : null;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  let total = 0;
  const inserts: any[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }) as unknown[][];
    if (!rows.length) continue;
    const header = String(rows[0]?.[0] || '').toLowerCase().trim();
    const mesNum = MESES_PT[header];
    if (!mesNum) continue;
    const anoMatch = sheetName.match(/(\d{4})/);
    const ano = anoMatch ? parseInt(anoMatch[1]) : new Date().getFullYear();

    let cartaoAtual: number | null = null;
    let tipoAtual: 'fixa'|'parcelada'|'avulsa' = 'avulsa';

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      const c0 = String(row[0]||'').trim();
      const c1 = String(row[1]||'').trim();
      const c0l = c0.toLowerCase();
      if (c0l === 'fixas') { tipoAtual = 'fixa'; continue; }
      if (c0l === 'parcelados') { tipoAtual = 'parcelada'; continue; }
      const ck = Object.keys(CARTAO_MAP).find(k => c0l.includes(k));
      if (ck) { cartaoAtual = CARTAO_MAP[ck]; tipoAtual = 'avulsa'; continue; }
      const n0 = parseFloat(c0.replace(',','.'));
      if (!isNaN(n0) && n0 > 0 && !c1) continue;
      const descricao = c1 || c0;
      if (!descricao || descricao.length < 2) continue;
      let valor: number | null = null;
      for (let c = row.length-1; c >= 2; c--) { valor = parseVal(row[c]); if (valor) break; }
      if (!valor) continue;
      const data = parseDate(row[0]) || `${ano}-${String(mesNum).padStart(2,'0')}-05`;
      const pm = descricao.match(/(\d+)\/(\d+)$/);
      inserts.push({
        descricao: descricao.replace(/\s+\d+\/\d+$/,'').trim() || descricao,
        valor, data,
        tipo: pm ? 'parcelada' : tipoAtual,
        cartao_id: cartaoAtual,
        parcela_atual: pm ? parseInt(pm[1]) : 1,
        total_parcelas: pm ? parseInt(pm[2]) : 1,
      });
    }
  }

  if (inserts.length) {
    const { error } = await supabase.from('transacoes').insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    total = inserts.length;
  }

  return NextResponse.json({ success: true, importadas: total });
}
