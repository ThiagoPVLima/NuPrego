import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const FUSO = 'America/Sao_Paulo';
const DIA_REVISAO = 'Sun';

function dataLocal(deslocamentoDias = 0) {
  const d = new Date(Date.now() + deslocamentoDias * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO }).format(d);
}

function diaDaSemana() {
  return new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short' }).format(new Date());
}

type Aviso = { title: string; body: string; url: string };

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'nao autorizado' }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const amanha = dataLocal(1);
  const hoje = dataLocal(0);
  const revisao = diaDaSemana() === DIA_REVISAO;
  const porUsuario = new Map<string, NonNullable<typeof subs>>();
  for (const s of subs ?? []) porUsuario.set(s.user_id, [...(porUsuario.get(s.user_id) ?? []), s]);

  let enviados = 0;
  for (const [userId, lista] of porUsuario) {
    const { data: abertas } = await supabase
      .from('tarefas')
      .select('titulo, estado, data_limite')
      .eq('user_id', userId)
      .neq('estado', 'feito');
    const tarefas = abertas ?? [];

    const avisos: Aviso[] = [];
    const comPrazo = tarefas
      .filter(t => t.data_limite && t.data_limite <= amanha)
      .sort((a, b) => a.data_limite.localeCompare(b.data_limite));
    if (comPrazo.length > 0) {
      const linhas = comPrazo.slice(0, 3).map(t =>
        `${t.data_limite < hoje ? 'atrasada' : t.data_limite === hoje ? 'hoje' : 'amanhã'}: ${t.titulo}`
      );
      const resto = comPrazo.length - linhas.length;
      avisos.push({
        title: comPrazo.length === 1 ? '1 tarefa com prazo' : `${comPrazo.length} tarefas com prazo`,
        body: linhas.join('\n') + (resto > 0 ? `\ne mais ${resto}` : ''),
        url: '/tarefas',
      });
    }
    if (revisao && tarefas.length > 0) {
      const noInbox = tarefas.filter(t => t.estado === 'inbox').length;
      avisos.push({
        title: 'Revisão da semana',
        body: noInbox > 0 ? `${noInbox} no inbox. Dez minutos para organizar.` : 'Dez minutos para escolher o que fica em Agora.',
        url: noInbox > 0 ? '/tarefas/revisao' : '/tarefas',
      });
    }

    for (const aviso of avisos) {
      for (const s of lista) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(aviso),
          );
          enviados++;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          }
        }
      }
    }
  }

  return NextResponse.json({ enviados });
}
