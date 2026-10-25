import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { consultarSalud, listarProductos } from '@/lib/api';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; productos: number }
  | { tipo: 'error'; mensaje: string };

export function EstadoServidor() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  const comprobar = useCallback(async () => {
    setEstado({ tipo: 'cargando' });
    try {
      await consultarSalud();
      const productos = await listarProductos();
      setEstado({ tipo: 'ok', productos: productos.length });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      setEstado({ tipo: 'error', mensaje });
    }
  }, []);

  useEffect(() => {
    comprobar();
  }, [comprobar]);

  return (
    <ThemedView type="backgroundElement" style={styles.tarjeta}>
      <ThemedText type="code">Servidor</ThemedText>

      {estado.tipo === 'cargando' && <ActivityIndicator />}
      {estado.tipo === 'ok' && (
        <ThemedText>Conectado · {estado.productos} productos en el catálogo</ThemedText>
      )}
      {estado.tipo === 'error' && <ThemedText>{estado.mensaje}</ThemedText>}

      <Pressable style={styles.boton} onPress={comprobar}>
        <ThemedText type="small">Reintentar</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  boton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#888',
  },
});