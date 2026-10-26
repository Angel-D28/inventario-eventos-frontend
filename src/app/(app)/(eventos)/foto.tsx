import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { eliminarFoto, fuenteImagen, listarFotos } from '@/lib/api';
import { formatearFechaHora } from '@/lib/formato';
import { useDatos } from '@/lib/use-datos';

export default function VisorFoto() {
  const router = useRouter();
  const { eventoId, fotoId } = useLocalSearchParams<{ eventoId: string; fotoId: string }>();
  const cargador = useCallback(() => listarFotos(eventoId), [eventoId]);
  const { datos, error, cargando, recargar } = useDatos(cargador);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  if (cargando && datos === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  const foto = datos?.find((f) => f.id === fotoId) ?? null;

  if (foto === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ThemedText style={styles.centrarTexto}>{error ?? 'No se encontró la foto'}</ThemedText>
        <Pressable style={styles.botonSecundario} onPress={recargar}>
          <ThemedText type="small">Reintentar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  async function eliminar() {
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarFoto(fotoId);
      router.back();
    } catch (e) {
      setErrorEliminar(e instanceof Error ? e.message : 'No se pudo eliminar la foto');
      setEliminando(false);
    }
  }

  function confirmarEliminar() {
    Alert.alert('Eliminar foto', 'Esta foto es evidencia. ¿Seguro que quieres eliminarla?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void eliminar() },
    ]);
  }

  return (
    <ThemedView style={styles.contenedor}>
      <Image source={fuenteImagen(foto.url)} contentFit="contain" style={styles.imagen} />

      <View style={styles.datos}>
        <ThemedText type="smallBold">
          {foto.momento === 'RECEPCION' ? 'Recepción' : 'Devolución'}
          {foto.productoNombre ? ` · ${foto.productoNombre}` : ' · general'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tomada: {formatearFechaHora(foto.tomadaEn)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Recibida por el servidor: {formatearFechaHora(foto.subidaEn)}
        </ThemedText>

        {errorEliminar !== null && (
          <ThemedText type="small" style={styles.error}>
            {errorEliminar}
          </ThemedText>
        )}

        <Pressable
          style={[styles.botonPeligro, eliminando && styles.inactivo]}
          onPress={confirmarEliminar}
          disabled={eliminando}>
          <ThemedText style={styles.textoPeligro}>Eliminar foto</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centrarTexto: { textAlign: 'center' },
  contenedor: { flex: 1 },
  imagen: { flex: 1, width: '100%' },
  datos: { padding: Spacing.four, gap: Spacing.two },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  botonPeligro: {
    borderWidth: 1,
    borderColor: '#d93025',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  textoPeligro: { color: '#d93025' },
  error: { color: '#d93025' },
  inactivo: { opacity: 0.5 },
});