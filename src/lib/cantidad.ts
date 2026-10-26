const MAXIMO = 100_000;

/** "48" → 48. Devuelve null si no es un entero entre 1 y 100000. */
export function parsearCantidad(texto: string): number | null {
  if (!/^\d+$/.test(texto)) return null;
  const numero = Number(texto);
  return numero >= 1 && numero <= MAXIMO ? numero : null;
}