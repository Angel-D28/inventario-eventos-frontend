import { API_URL } from './config';
import { File } from 'expo-file-system';
import { fetch as fetchExpo } from 'expo/fetch';

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
  } catch (e) {
    // Solo en desarrollo, y sin datos sensibles (ni cabeceras ni cuerpo).
    if (__DEV__) {
      console.warn(`[api] ${metodo} ${ruta} falló:`, e instanceof Error ? e.message : e);
    }
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
async function extraerMensaje(respuesta: {
  status: number;
  json: () => Promise<unknown>;
}): Promise<string> {
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

// ---------- Crear productos ----------

export type NuevoProducto = { nombre: string; tipo: TipoProducto };

export function crearProducto(datos: NuevoProducto): Promise<Producto> {
  return solicitar<Producto>('/api/productos', { metodo: 'POST', cuerpo: datos });
}

// ---------- Productos de un evento ----------

function rutaItem(eventoId: string, productoId: string): string {
  return `/api/eventos/${encodeURIComponent(eventoId)}/items/${encodeURIComponent(productoId)}`;
}

/** Crea el producto en el evento o, si ya está, actualiza su cantidad. */
export function registrarItem(
  eventoId: string,
  productoId: string,
  cantidadRecibida: number,
  observaciones: string | null,
): Promise<EventoItem> {
  return solicitar<EventoItem>(rutaItem(eventoId, productoId), {
    metodo: 'PUT',
    cuerpo: { cantidadRecibida, observaciones },
  });
}

export function quitarItem(eventoId: string, productoId: string): Promise<void> {
  return solicitar<void>(rutaItem(eventoId, productoId), { metodo: 'DELETE' });
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


// ---------- Planeadores ----------

export type Planeador = {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
};

export function listarPlaneadores(): Promise<Planeador[]> {
  return solicitar<Planeador[]>('/api/planeadores');
}

export function crearPlaneador(nombre: string): Promise<Planeador> {
  return solicitar<Planeador>('/api/planeadores', { metodo: 'POST', cuerpo: { nombre } });
}

// ---------- Crear evento ----------

export type NuevoEvento = {
  planeadorId: string;
  nombre: string;
  lugar: string | null;
  fecha: string; // "2026-11-14"
};

export function crearEvento(datos: NuevoEvento): Promise<EventoDetalle> {
  return solicitar<EventoDetalle>('/api/eventos', { metodo: 'POST', cuerpo: datos });
}

// ---------- Fotos ----------

export type MomentoFoto = 'RECEPCION' | 'DEVOLUCION';

export type Foto = {
  id: string;
  eventoId: string;
  productoId: string | null;
  productoNombre: string | null;
  momento: MomentoFoto;
  tomadaEn: string; // instante ISO: "2026-10-26T03:12:00Z"
  subidaEn: string;
  url: string; // "/api/fotos/<id>/archivo"
};

export type FotoLocal = { uri: string; tomadaEn: Date };

function rutaFotos(eventoId: string): string {
  return `/api/eventos/${encodeURIComponent(eventoId)}/fotos`;
}

export function listarFotos(eventoId: string): Promise<Foto[]> {
  return solicitar<Foto[]>(rutaFotos(eventoId));
}

export async function subirFoto(
  eventoId: string,
  momento: MomentoFoto,
  foto: FotoLocal,
  productoId?: string,
): Promise<Foto> {
  const formulario = new FormData();
  // El File de expo-file-system es un Blob: el nombre y el tipo (image/jpeg) salen del archivo.
  formulario.append('file', new File(foto.uri));
  formulario.append('momento', momento);
  // Un INSTANTE sí se envía en UTC (a diferencia de una fecha de calendario).
  formulario.append('tomadaEn', foto.tomadaEn.toISOString());
  if (productoId) formulario.append('productoId', productoId);

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 60_000);

  let respuesta: Awaited<ReturnType<typeof fetchExpo>>;
  try {
    respuesta = await fetchExpo(`${API_URL}${rutaFotos(eventoId)}`, {
      method: 'POST',
      headers: tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {},
      body: formulario,
      signal: controlador.signal,
    });
  } catch (e) {
    if (__DEV__) {
      console.warn('[subirFoto] falló el envío:', e instanceof Error ? e.message : e);
    }
    throw new ApiError('No se pudo conectar con el servidor');
  } finally {
    clearTimeout(temporizador);
  }

  if (respuesta.status === 401) {
    alExpirarSesion?.();
    throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', 401);
  }
  if (!respuesta.ok) {
    throw new ApiError(await extraerMensaje(respuesta), respuesta.status);
  }
  return (await respuesta.json()) as Foto;
}

export function eliminarFoto(fotoId: string): Promise<void> {
  return solicitar<void>(`/api/fotos/${encodeURIComponent(fotoId)}`, { metodo: 'DELETE' });
}

/** Fuente para <Image>: la foto exige token, así que viaja con la cabecera Authorization. */
export function fuenteImagen(ruta: string) {
  return {
    uri: `${API_URL}${ruta}`,
    headers: tokenActual ? { Authorization: `Bearer ${tokenActual}` } : undefined,
  };
}

export function confirmarRecepcion(eventoId: string): Promise<EventoDetalle> {
  return solicitar<EventoDetalle>(`/api/eventos/${encodeURIComponent(eventoId)}/recibir`, {
    metodo: 'POST',
  });
}