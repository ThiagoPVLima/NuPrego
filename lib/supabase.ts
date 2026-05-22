import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Cartao = {
  id: number;
  nome: string;
  cor: string;
  limite: number;
  fechamento: number;
  vencimento: number;
  ativo: boolean;
};

export type Categoria = {
  id: number;
  nome: string;
  icone: string;
  cor: string;
};

export type Transacao = {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'fixa' | 'parcelada' | 'avulsa';
  cartao_id: number | null;
  categoria_id: number | null;
  parcela_atual: number;
  total_parcelas: number;
  grupo_parcela: string | null;
  cartoes?: Cartao;
  categorias?: Categoria;
};

export type Mes = {
  id: number;
  ano: number;
  mes: number;
  renda: number;
  observacoes: string;
};
