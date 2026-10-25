import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga datos al abrir la pantalla y permite recargar o refrescar.
 * IMPORTANTE: `cargador` debe ser estable (una función de módulo o un useCallback);
 * si fuera una función nueva en cada render, se volvería a cargar sin parar.
 */
export function useDatos<T>(cargador: () => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const ultimaPeticion = useRef(0);

  const ejecutar = useCallback(
    async (esRefresco: boolean) => {
      const numero = ++ultimaPeticion.current;
      if (esRefresco) setRefrescando(true);
      else setCargando(true);
      setError(null);
      try {
        const resultado = await cargador();
        if (numero !== ultimaPeticion.current) return; // llegó una respuesta vieja
        setDatos(resultado);
      } catch (e) {
        if (numero !== ultimaPeticion.current) return;
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        if (numero === ultimaPeticion.current) {
          setCargando(false);
          setRefrescando(false);
        }
      }
    },
    [cargador],
  );

  useEffect(() => {
    void ejecutar(false);
  }, [ejecutar]);

  return {
    datos,
    error,
    cargando,
    refrescando,
    recargar: () => ejecutar(false),
    refrescar: () => ejecutar(true),
  };
}