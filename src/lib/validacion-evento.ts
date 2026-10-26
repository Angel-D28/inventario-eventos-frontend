export type ErroresEvento = {
    nombre?: string;
    lugar?: string;
    planeador?: string;
  };
  
  type DatosEvento = {
    nombre: string;
    lugar: string;
    planeadorId: string | null;
  };
  
  /** Refleja las reglas del backend (EventoRequest) para avisar antes de enviar. */
  export function validarEvento(datos: DatosEvento): ErroresEvento {
    const errores: ErroresEvento = {};
  
    const nombre = datos.nombre.trim();
    if (nombre.length === 0) errores.nombre = 'El nombre es obligatorio';
    else if (nombre.length > 200) errores.nombre = 'Máximo 200 caracteres';
  
    if (datos.lugar.trim().length > 200) errores.lugar = 'Máximo 200 caracteres';
  
    if (datos.planeadorId === null) errores.planeador = 'Elige un planeador';
  
    return errores;
  }