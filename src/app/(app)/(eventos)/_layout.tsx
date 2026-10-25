import { Stack } from 'expo-router';

export default function EventosLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Eventos' }} />
      <Stack.Screen name="evento/[id]" options={{ title: 'Evento' }} />
    </Stack>
  );
}