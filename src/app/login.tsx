import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { iniciarSesion } = useAuth();
  const oscuro = useColorScheme() === 'dark';
  const colorTexto = oscuro ? '#ffffff' : '#000000';
  const colorSuave = oscuro ? '#9a9a9a' : '#6b6b6b';

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puedeEnviar = usuario.trim().length > 0 && contrasena.length > 0 && !enviando;

  async function enviar() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(usuario.trim(), contrasena);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ThemedView style={styles.contenedor}>
      <SafeAreaView style={styles.area}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formulario}>
          <ThemedText type="title" style={styles.centrado}>
            Inventario
          </ThemedText>
          <ThemedText type="small" style={styles.centrado}>
            Inicia sesión para continuar
          </ThemedText>

          <TextInput
            style={[styles.campo, { color: colorTexto, borderColor: colorSuave }]}
            placeholder="Usuario"
            placeholderTextColor={colorSuave}
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            editable={!enviando}
          />
          <TextInput
            style={[styles.campo, { color: colorTexto, borderColor: colorSuave }]}
            placeholder="Contraseña"
            placeholderTextColor={colorSuave}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={enviar}
            editable={!enviando}
          />

          {error !== null && <ThemedText style={styles.error}>{error}</ThemedText>}

          <Pressable
            style={[styles.boton, !puedeEnviar && styles.botonInactivo]}
            onPress={enviar}
            disabled={!puedeEnviar}>
            {enviando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.textoBoton}>Entrar</ThemedText>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  area: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
  formulario: { gap: Spacing.three },
  centrado: { textAlign: 'center' },
  campo: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: '#d93025', textAlign: 'center' },
  boton: {
    backgroundColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonInactivo: { opacity: 0.5 },
  textoBoton: { color: '#ffffff', fontWeight: '600' },
});