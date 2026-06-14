export const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export const pct = (val: number, total: number) =>
  total > 0 ? Math.round((val / total) * 100) : 0;

export const fmtData = (d: string): string => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const tipoCor: Record<string, string> = {
  fixa: 'var(--color-fixa)',
  parcelada: 'var(--color-parcelada)',
  avulsa: 'var(--color-avulsa)',
};

export const tipoLabel: Record<string, string> = {
  fixa: 'Fixa',
  parcelada: 'Parcelada',
  avulsa: 'Avulsa',
};

import { MEIO_CORES } from './constants';

export const meioCor: Record<string, string> = {
  pix: MEIO_CORES.pix,
  dinheiro: MEIO_CORES.dinheiro,
};

export const meioLabel: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
};
