import { useCallback, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { subirFoto, type FotoLocal, type MomentoFoto } from './api';
import { tomarFoto } from './camara';

function avisarSinPermiso(puedePedirDeNuevo: boolean) {
  if (puedePedirDeNuevo) {
    Alert.alert('Permiso de cámara', 'Necesitamos la cámara para tomar las fotos de evidencia. Vuelve a intentarlo y acepta el permiso.');
    return;
  }
  Alert.alert(
    'Permiso de cámara',
    'El acceso a la cámara está desactivado. Actívalo en Ajustes para tomar fotos de evidencia.',
    [
      { text: 'Ahora no', style: 'cancel' },
      { text: 'Abrir Ajustes', onPress: () => void Linking.openSettings() },
    ],
  );
}

export function useFotografiar(eventoId: string, momento: MomentoFoto, productoId?: string) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<FotoLocal | null>(null);
  const enCurso = useRef(false); // evita dos operaciones simultáneas por doble toque

  const enviar = useCallback(
    async (foto: FotoLocal): Promise<boolean> => {
      setSubiendo(true);
      setError(null);
      try {
        await subirFoto(eventoId, momento, foto, productoId);
        setPendiente(null);
        return true;
      } catch (e) {
        // La foto NO se pierde: queda pendiente para reintentar.
        setPendiente(foto);
        setError(e instanceof Error ? e.message : 'No se pudo subir la foto');
        return false;
      } finally {
        setSubiendo(false);
      }
    },
    [eventoId, momento, productoId],
  );

  const fotografiar = useCallback(async (): Promise<boolean> => {
    if (enCurso.current) return false;
    enCurso.current = true;
    try {
      setError(null);
      const resultado = await tomarFoto();
      if (resultado.tipo === 'cancelada') return false;
      if (resultado.tipo === 'sin-permiso') {
        avisarSinPermiso(resultado.puedePedirDeNuevo);
        return false;
      }
      return await enviar(resultado.foto);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo usar la cámara');
      return false;
    } finally {
      enCurso.current = false;
    }
  }, [enviar]);

  const reintentar = useCallback(async (): Promise<boolean> => {
    if (pendiente === null || enCurso.current) return false;
    enCurso.current = true;
    try {
      return await enviar(pendiente);
    } finally {
      enCurso.current = false;
    }
  }, [enviar, pendiente]);

  return { fotografiar, reintentar, subiendo, error, hayPendiente: pendiente !== null };
}