import type { TipoProducto } from './api';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * "2026-11-14" → "14 nov 2026".
 * Se separa a mano a propósito: new Date("2026-11-14") se interpreta como medianoche UTC,
 * y en Colombia (UTC-5) mostraría el día anterior.
 */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return iso;
  return `${dia} ${MESES[mes - 1] ?? ''} ${anio}`;
}

export const ETIQUETA_TIPO: Record<TipoProducto, string> = {
  LICOR: 'Licor',
  MENAJE: 'Menaje',
  CRISTALERIA: 'Cristalería',
};