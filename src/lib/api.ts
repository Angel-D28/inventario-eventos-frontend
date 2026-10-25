import { API_URL } from './config';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Estado de la sesión a nivel de módulo; lo configura el AuthProvider.
let tokenActual: string | null = null;
let alExpirarSesion: (() => void) | null = null;

export function establecerToken(token: string | null) {
  tokenActual = token;
}

export function registrarAlExpirar(callback: () => void) {
  alExpirarSesion = callback;
}

type Opciones = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  /** Con false no se envía el token (login y salud). */
  conToken?: boolean;
  timeoutMs?: number;
};

async function solicitar<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, conToken = true, timeoutMs = 8000 } = opciones;

  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (conToken && tokenActual) cabeceras.Authorization = `Bearer ${tokenActual}`;

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor');
  } finally {
    clearTimeout(temporizador);
  }

  // Un 401 con token significa sesión vencida o inválida (no credenciales malas).
  if (respuesta.status === 401 && conToken) {
    alExpirarSesion?.();
    throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  }
  if (!respuesta.ok) {
    throw new ApiError(await extraerMensaje(respuesta), respuesta.status);
  }
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

/** El backend responde los errores como ProblemDetail: { title, status, detail }. */
async function extraerMensaje(respuesta: Response): Promise<string> {
  try {
    const problema = (await respuesta.json()) as { detail?: string };
    if (problema.detail) return problema.detail;
  } catch {
    // El cuerpo no era JSON: usamos el mensaje genérico.
  }
  return `El servidor respondió ${respuesta.status}`;
}

// ---------- Endpoints ----------

export type Salud = { status: string };

export function consultarSalud(): Promise<Salud> {
  return solicitar<Salud>('/actuator/health', { conToken: false });
}

export type TokenRespuesta = { accessToken: string; tokenType: string; expiresIn: number };

export function iniciarSesionApi(username: string, password: string): Promise<TokenRespuesta> {
  return solicitar<TokenRespuesta>('/api/auth/login', {
    metodo: 'POST',
    cuerpo: { username, password },
    conToken: false,
  });
}

export type Producto = {
  id: string;
  nombre: string;
  tipo: 'LICOR' | 'MENAJE' | 'CRISTALERIA';
  fotoUrl: string | null;
  activo: boolean;
};

export function listarProductos(): Promise<Producto[]> {
  return solicitar<Producto[]>('/api/productos');
}