import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EstadoEventoBadge } from '@/components/estado-evento';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listarEventos, type EventoResumen } from '@/lib/api';
import { formatearFecha } from '@/lib/formato';
import { useDatos } from '@/lib/use-datos';

export default function ListaEventos() {
  const router = useRouter();
  const { datos, error, cargando, refrescando, recargar, refrescar } = useDatos(listarEventos);

  if (cargando && datos === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error !== null && datos === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ThemedText style={styles.centrarTexto}>{error}</ThemedText>
        <Pressable style={styles.boton} onPress={recargar}>
          <ThemedText type="small">Reintentar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={datos ?? []}
      keyExtractor={(evento) => evento.id}
      renderItem={({ item }) => (
        <TarjetaEvento evento={item} onPress={() => router.push(`/evento/${item.id}`)} />
      )}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.lista}
      refreshing={refrescando}
      onRefresh={refrescar}
      ListHeaderComponent={
        error !== null ? <ThemedText style={styles.aviso}>{error}</ThemedText> : undefined
      }
      ListEmptyComponent={<ThemedText style={styles.centrarTexto}>Aún no hay eventos.</ThemedText>}
    />
  );
}

function TarjetaEvento({ evento, onPress }: { evento: EventoResumen; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pulsada}>
      <ThemedView type="backgroundElement" style={styles.tarjeta}>
        <View style={styles.fila}>
          <ThemedText type="smallBold" style={styles.nombre}>
            {evento.nombre}
          </ThemedText>
          <EstadoEventoBadge estado={evento.estado} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatearFecha(evento.fecha)} · {evento.lugar ?? 'Sin lugar'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {evento.planeadorNombre}
        </ThemedText>
      </ThemedView>
    </Pressable>
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
  lista: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  aviso: { color: '#d93025', textAlign: 'center' },
  tarjeta: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  pulsada: { opacity: 0.7 },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nombre: { flex: 1 },
});