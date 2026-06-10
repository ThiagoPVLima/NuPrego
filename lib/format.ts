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
  fixa: '#8083ff',
  parcelada: '#ffb783',
  avulsa: '#6edab4',
};

export const tipoLabel: Record<string, string> = {
  fixa: 'Fixa',
  parcelada: 'Parcelada',
  avulsa: 'Avulsa',
};

export const meioCor: Record<string, string> = {
  pix: '#00b8d4',
  dinheiro: '#6edab4',
};

export const meioLabel: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
};
