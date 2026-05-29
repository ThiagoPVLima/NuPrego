import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcFatura } from '@/lib/billing';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get('mes');
  const cartao_id = searchParams.get('cartao_id');
  const tipo = searchParams.get('tipo');
  const busca = searchParams.get('busca');
  const meio = searchParams.get('meio');
  const categoria_id = searchParams.get('categoria_id');

  let query = supabase
    .from('transacoes')
    .select('*, cartoes(id,nome,cor), categorias(id,nome,icone,cor)')
    .order('data', { ascending: false })
    .order('id', { ascending: false });

  if (mes) {
    const [ano, m] = mes.split('-');
    const anoN = parseInt(ano), mesN = parseInt(m);
    const mesPrefix = `${ano}-${m.padStart(2, '0')}`;
    const ultimoDia = new Date(anoN, mesN, 0).getDate();
    const mesUltimoDia = `${mesPrefix}-${String(ultimoDia).padStart(2, '0')}`;
    // inclui registros com fatura_mes correto OU fatura_mes nulo mas data no mês (fallback pré-migração)
    query = query.or(
      `and(fatura_ano.eq.${anoN},fatura_mes.eq.${mesN}),and(fatura_mes.is.null,data.gte.${mesPrefix}-01,data.lte.${mesUltimoDia})`
    );
  }
  if (cartao_id) query = query.eq('cartao_id', cartao_id);
  if (tipo) query = query.eq('tipo', tipo);
  if (busca) query = query.ilike('descricao', `%${busca}%`);
  if (meio) query = query.eq('meio_pagamento', meio);
  if (categoria_id) query = query.contains('categoria_ids', [parseInt(categoria_id)]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Projeta fixas ativas que não têm registro explícito no mês consultado
  // Só quando filtra por mês e sem filtro de tipo específico (ou tipo=fixa)
  if (mes && (!tipo || tipo === 'fixa') && !cartao_id && !categoria_id) {
    const [ano, m] = mes.split('-');
    const mesPrefix = `${ano}-${m.padStart(2, '0')}`;
    const firstDayOfM = `${mesPrefix}-01`;

    // Carrega fixas_config para saber quais estão desativadas
    const fixasConfig: Record<string, { ativa: boolean; data_inicio: string | null }> = {};
    try {
      const { data: cfgs } = await supabase.from('fixas_config').select('descricao, ativa, data_inicio');
      for (const c of cfgs || []) {
        fixasConfig[(c.descricao || '').toLowerCase()] = { ativa: c.ativa, data_inicio: c.data_inicio };
      }
    } catch { /* tabela ainda não existe, projeta tudo normalmente */ }

    // Número de meses entre duas datas YYYY-MM-DD (a deve ser <= b)
    const monthsBetween = (a: string, b: string): number => {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      return (by - ay) * 12 + (bm - am);
    };

    // Projeta se:
    //  1. fixas_config diz "ativa" (respeita data_inicio) → sempre projeta
    //  2. Sem config: projeta só se último registro foi há ≤ 3 meses do mês pedido
    //  3. fixas_config diz "inativa" → nunca projeta
    const shouldProject = (descricao: string, lastRowData: string): boolean => {
      const cfg = fixasConfig[descricao.toLowerCase()];
      if (cfg) {
        if (!cfg.ativa) return false;
        if (cfg.data_inicio && firstDayOfM < cfg.data_inicio) return false;
        return true; // explicitamente ativa: sem limite de tempo
      }
      // Sem config: recorrência natural — projeta só se pagamento recente (≤ 3 meses)
      return monthsBetween(lastRowData.substring(0, 7) + '-01', firstDayOfM) <= 3;
    };

    const { data: prevFixas } = await supabase
      .from('transacoes')
      .select('descricao, valor, tipo, meio_pagamento, cartao_id, categoria_id, categoria_ids, data, cartoes(id,nome,cor), categorias(id,nome,icone,cor)')
      .eq('tipo', 'fixa')
      .lt('data', `${mesPrefix}-01`)
      .order('data', { ascending: false })
      .limit(500);

    const thisMonthDescs = new Set(
      (data || []).filter((t: any) => t.tipo === 'fixa').map((t: any) => (t.descricao || '').toLowerCase())
    );

    const projMap = new Map<string, any>();
    for (const f of prevFixas || []) {
      if (busca && !f.descricao?.toLowerCase().includes(busca.toLowerCase())) continue;
      const key = (f.descricao || '').toLowerCase();
      // prevFixas está ordenado DESC por data: primeira ocorrência de cada key = mais recente
      if (!thisMonthDescs.has(key) && !projMap.has(key)) {
        if (!shouldProject(f.descricao || '', f.data)) continue;
        projMap.set(key, { ...f, id: null, projetado: true, data: `${mesPrefix}-01`, fatura_ano: parseInt(ano), fatura_mes: parseInt(m) });
      }
    }

    const combined = [...(data || []), ...Array.from(projMap.values())];
    return NextResponse.json(combined);
  }

  return NextResponse.json(data);
}

async function getFechamento(cartao_id: number | null): Promise<number | null> {
  if (!cartao_id) return null;
  const { data } = await supabase.from('cartoes').select('fechamento').eq('id', cartao_id).single();
  return data?.fechamento ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { descricao, valor, data, tipo, cartao_id, categoria_ids, total_parcelas, meio_pagamento, pago: pagoExplicito } = body;
  const catIds: number[] = Array.isArray(categoria_ids) ? categoria_ids : [];
  const catId = catIds[0] ?? null;
  const fechamento = await getFechamento(cartao_id || null);

  const today = new Date().toISOString().split('T')[0];

  if (tipo === 'parcelada' && total_parcelas > 1) {
    const grupo = randomUUID();
    const valorParcela = Math.round((valor / total_parcelas) * 100) / 100;
    const inserts = [];
    const dataBase = new Date(data + 'T12:00:00');

    for (let i = 1; i <= total_parcelas; i++) {
      const targetMonth = dataBase.getMonth() + (i - 1);
      const targetYear = dataBase.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12;
      const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
      const day = Math.min(dataBase.getDate(), lastDay);
      const d = new Date(targetYear, normalizedMonth, day, 12, 0, 0);
      const dataStr = d.toISOString().split('T')[0];
      const { fatura_ano, fatura_mes } = calcFatura(dataStr, fechamento);
      inserts.push({
        descricao: `${descricao} ${i}/${total_parcelas}`,
        valor: valorParcela,
        data: dataStr,
        tipo,
        cartao_id: cartao_id || null,
        categoria_id: catId,
        categoria_ids: catIds,
        meio_pagamento: meio_pagamento || null,
        parcela_atual: i, total_parcelas, grupo_parcela: grupo,
        fatura_ano, fatura_mes,
        pago: pagoExplicito !== undefined ? pagoExplicito : dataStr <= today,
      });
    }
    const { error } = await supabase.from('transacoes').insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, grupo });
  }

  const { fatura_ano, fatura_mes } = calcFatura(data, fechamento);

  const { data: row, error } = await supabase.from('transacoes').insert({
    descricao, valor, data, tipo,
    cartao_id: cartao_id || null,
    categoria_id: catId,
    categoria_ids: catIds,
    meio_pagamento: meio_pagamento || null,
    parcela_atual: 1, total_parcelas: 1,
    fatura_ano, fatura_mes,
    pago: pagoExplicito !== undefined ? pagoExplicito : data <= today,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}
