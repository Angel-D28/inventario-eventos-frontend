import { API_URL } from './config';

export class ApiError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

/** fetch con tiempo máximo de espera: por defecto, fetch puede quedarse esperando para siempre. */
async function solicitar(ruta: string, timeoutMs = 8000): Promise<Response> {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), timeoutMs);
    try {
        return await fetch(`${API_URL}${ruta}`, { signal: controlador.signal });
    } catch {
        throw new ApiError('No se pudo conectar con el servidor');
    } finally {
        clearTimeout(temporizador);
    }
}

export type Salud = { status: string };

export async function consultarSalud(): Promise<Salud> {
    const respuesta = await solicitar('/actuator/health');
    if (!respuesta.ok) {
        throw new ApiError(`El servidor respondió ${respuesta.status}`, respuesta.status);
    }
    return (await respuesta.json()) as Salud;
}