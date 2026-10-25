import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoServidor } from '@/components/estado-servidor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/config';

export default function Cuenta() {
  const { cerrarSesion } = useAuth();

  return (
    <ThemedView style={styles.contenedor}>
      <SafeAreaView style={styles.area}>
        <ThemedText type="subtitle">Cuenta</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Servidor: {API_URL}
        </ThemedText>

        <EstadoServidor />

        <Pressable style={styles.boton} onPress={cerrarSesion}>
          <ThemedText>Cerrar sesión</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  area: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  boton: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});