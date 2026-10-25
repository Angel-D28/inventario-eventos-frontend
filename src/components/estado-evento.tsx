import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { EstadoEvento } from '@/lib/api';

const ESTILOS: Record<EstadoEvento, { texto: string; color: string }> = {
  PLANEADO: { texto: 'Planeado', color: '#8e8e93' },
  RECIBIDO: { texto: 'Recibido', color: '#2f6fed' },
  DEVUELTO: { texto: 'Devuelto', color: '#d98200' },
  CERRADO: { texto: 'Cerrado', color: '#2e9e5b' },
};

export function EstadoEventoBadge({ estado }: { estado: EstadoEvento }) {
  // Los tipos no se verifican en tiempo de ejecución: si el servidor agregara un estado nuevo, no nos caemos.
  const { texto, color } = ESTILOS[estado] ?? { texto: String(estado), color: '#8e8e93' };

  return (
    <View style={[styles.etiqueta, { borderColor: color }]}>
      <ThemedText type="small" style={{ color }}>
        {texto}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
});