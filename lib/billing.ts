export function shiftFaturaBack(fatura_ano: number, fatura_mes: number): { fatura_ano: number; fatura_mes: number } {
  if (fatura_mes === 1) return { fatura_ano: fatura_ano - 1, fatura_mes: 12 };
  return { fatura_ano, fatura_mes: fatura_mes - 1 };
}

export function calcFatura(
  data: string,
  fechamento: number | null | undefined,
): { fatura_ano: number; fatura_mes: number } {
  const d = new Date(data + 'T12:00:00');
  const ano = d.getFullYear();
  const mes = d.getMonth() + 1; // 1-12

  if (!fechamento) {
    return { fatura_ano: ano, fatura_mes: mes };
  }

  if (d.getDate() >= fechamento) {
    return { fatura_ano: ano, fatura_mes: mes };
  }

  // Before fechamento → goes to previous month's fatura
  const prev = new Date(ano, d.getMonth() - 1, 1);
  return { fatura_ano: prev.getFullYear(), fatura_mes: prev.getMonth() + 1 };
}
