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

/**
 * Date → "2026-11-14" usando la fecha LOCAL del teléfono.
 * No uses toISOString(): convierte a UTC y, en Colombia después de las 7 p. m.,
 * devolvería el día siguiente.
 */
export function aIsoLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Para comparar textos al buscar: minúsculas y sin tildes ("Champaña" → "champana"). */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .trim();
}