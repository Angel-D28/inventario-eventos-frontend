import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EstadoEventoBadge } from '@/components/estado-evento';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { obtenerEvento } from '@/lib/api';
import { ETIQUETA_TIPO, formatearFecha } from '@/lib/formato';
import { useDatos } from '@/lib/use-datos';

export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cargador = useCallback(() => obtenerEvento(id), [id]);
  const { datos: evento, error, cargando, refrescando, recargar, refrescar } = useDatos(cargador);

  if (cargando && evento === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (evento === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ThemedText style={styles.centrarTexto}>{error ?? 'No se encontró el evento'}</ThemedText>
        <Pressable style={styles.boton} onPress={recargar}>
          <ThemedText type="small">Reintentar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const conDevolucion = evento.estado !== 'PLANEADO';

  return (
    <>
      <Stack.Screen options={{ title: evento.nombre }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}>
        {error !== null && <ThemedText style={styles.aviso}>{error}</ThemedText>}

        <ThemedText type="subtitle">{evento.nombre}</ThemedText>
        <EstadoEventoBadge estado={evento.estado} />

        <ThemedView type="backgroundElement" style={styles.bloque}>
          <Dato etiqueta="Fecha" valor={formatearFecha(evento.fecha)} />
          <Dato etiqueta="Lugar" valor={evento.lugar ?? 'Sin lugar'} />
          <Dato etiqueta="Planeador" valor={evento.planeadorNombre} />
        </ThemedView>

        <ThemedText type="smallBold">Productos ({evento.items.length})</ThemedText>
        {evento.items.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Todavía no hay productos registrados.
          </ThemedText>
        )}

        {evento.items.map((item) => (
          <ThemedView key={item.productoId} type="backgroundElement" style={styles.bloque}>
            <ThemedText type="smallBold">{item.productoNombre}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {ETIQUETA_TIPO[item.tipo]} · Recibidas: {item.cantidadRecibida}
            </ThemedText>
            {conDevolucion && (
              <ThemedText type="small">
                Devueltas {item.cantidadDevuelta} · Rotas {item.cantidadRota} · Perdidas{' '}
                {item.cantidadPerdida} · Consumidas {item.cantidadConsumida}
              </ThemedText>
            )}
            {conDevolucion && item.diferencia !== 0 && (
              <ThemedText type="small" style={styles.aviso}>
                Sin cuadrar: {item.diferencia}
              </ThemedText>
            )}
          </ThemedView>
        ))}
      </ScrollView>
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText type="small">{valor}</ThemedText>
    </View>
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
  boton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#888',
  },
  contenido: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  aviso: { color: '#d93025' },
  bloque: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  dato: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
});