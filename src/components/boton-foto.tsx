import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { MomentoFoto } from '@/lib/api';
import { useFotografiar } from '@/lib/use-fotografiar';

type Props = {
  eventoId: string;
  momento: MomentoFoto;
  productoId?: string;
  etiqueta: string;
  /** Se llama cuando una foto se subió con éxito. */
  alSubir?: () => void;
};

export function BotonFoto({ eventoId, momento, productoId, etiqueta, alSubir }: Props) {
  const { fotografiar, reintentar, subiendo, error, hayPendiente } = useFotografiar(
    eventoId,
    momento,
    productoId,
  );

  async function tomar() {
    if (await fotografiar()) alSubir?.();
  }

  async function reintentarSubida() {
    if (await reintentar()) alSubir?.();
  }

  return (
    <View style={styles.contenedor}>
      <Pressable
        style={[styles.boton, (subiendo || hayPendiente) && styles.inactivo]}
        onPress={tomar}
        disabled={subiendo || hayPendiente}>
        {subiendo ? (
          <ActivityIndicator />
        ) : (
          <ThemedText type="small">{etiqueta}</ThemedText>
        )}
      </Pressable>

      {error !== null && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}

      {hayPendiente && !subiendo && (
        <Pressable style={styles.botonReintentar} onPress={reintentarSubida}>
          <ThemedText type="small" style={styles.textoReintentar}>
            Reintentar subida de la foto
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: Spacing.two, alignItems: 'flex-start' },
  boton: {
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minWidth: 150,
    alignItems: 'center',
  },
  botonReintentar: {
    backgroundColor: '#2f6fed',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  textoReintentar: { color: '#ffffff' },
  error: { color: '#d93025' },
  inactivo: { opacity: 0.5 },
});