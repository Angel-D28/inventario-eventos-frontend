import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function EventosLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Eventos',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/nuevo')}
              hitSlop={12}
              accessibilityLabel="Nuevo evento">
              <ThemedText type="link">Nuevo</ThemedText>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="evento/[id]" options={{ title: 'Evento' }} />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo evento', presentation: 'modal' }} />
    </Stack>
  );
}