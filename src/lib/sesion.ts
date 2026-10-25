import * as SecureStore from 'expo-secure-store';

const CLAVE = 'sesion';
const MARGEN_MS = 60_000; // se considera vencido un minuto antes, por la hora del teléfono

type SesionGuardada = { token: string; venceEn: number };

export async function guardarSesion(token: string, expiraEnSegundos: number): Promise<void> {
  const sesion: SesionGuardada = { token, venceEn: Date.now() + expiraEnSegundos * 1000 };
  await SecureStore.setItemAsync(CLAVE, JSON.stringify(sesion));
}

/** Devuelve la sesión guardada si sigue vigente; si no, la borra y devuelve null. */
export async function leerSesion(): Promise<SesionGuardada | null> {
  const crudo = await SecureStore.getItemAsync(CLAVE);
  if (!crudo) return null;

  try {
    const sesion = JSON.parse(crudo) as SesionGuardada;
    if (
      typeof sesion.token === 'string' &&
      typeof sesion.venceEn === 'number' &&
      sesion.venceEn - MARGEN_MS > Date.now()
    ) {
      return sesion;
    }
  } catch {
    // Contenido corrupto: se trata como si no hubiera sesión.
  }
  await SecureStore.deleteItemAsync(CLAVE);
  return null;
}

export async function borrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE);
}