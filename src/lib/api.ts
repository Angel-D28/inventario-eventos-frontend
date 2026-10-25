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
  const token = conToken ? tokenActual : null;

  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;

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

  if (respuesta.status === 401 && conToken) {
    // "Sesión expirada" solo si ENVIAMOS un token y el servidor lo rechazó.
    if (token) {
      alExpirarSesion?.();
      throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
    }
    throw new ApiError('Necesitas iniciar sesión', 401);
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

// ---------- Salud y sesión ----------

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

// ---------- Productos ----------

export type TipoProducto = 'LICOR' | 'MENAJE' | 'CRISTALERIA';

export type Producto = {
  id: string;
  nombre: string;
  tipo: TipoProducto;
  fotoUrl: string | null;
  activo: boolean;
};

export function listarProductos(): Promise<Producto[]> {
  return solicitar<Producto[]>('/api/productos');
}

// ---------- Eventos ----------

export type EstadoEvento = 'PLANEADO' | 'RECIBIDO' | 'DEVUELTO' | 'CERRADO';

export type EventoResumen = {
  id: string;
  nombre: string;
  lugar: string | null;
  fecha: string; // "2026-11-14"
  estado: EstadoEvento;
  planeadorId: string;
  planeadorNombre: string;
};

export type EventoItem = {
  productoId: string;
  productoNombre: string;
  tipo: TipoProducto;
  cantidadRecibida: number;
  cantidadDevuelta: number;
  cantidadRota: number;
  cantidadPerdida: number;
  cantidadConsumida: number;
  diferencia: number;
  observaciones: string | null;
};

export type EventoDetalle = EventoResumen & { items: EventoItem[] };

export function listarEventos(): Promise<EventoResumen[]> {
  return solicitar<EventoResumen[]>('/api/eventos');
}

export function obtenerEvento(id: string): Promise<EventoDetalle> {
  // El id viene de la URL de la pantalla, o sea, de fuera: se codifica por precaución.
  return solicitar<EventoDetalle>(`/api/eventos/${encodeURIComponent(id)}`);
}