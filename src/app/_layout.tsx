import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function Navegacion() {
  const { estado } = useAuth();

  if (estado === 'cargando') {
    return (
      <ThemedView style={styles.centrado}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  const conSesion = estado === 'con-sesion';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={conSesion}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!conSesion}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navegacion />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
