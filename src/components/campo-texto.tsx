import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = TextInputProps & {
  etiqueta: string;
  error?: string | null;
};

export function CampoTexto({ etiqueta, error, style, ...resto }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.contenedor}>
      <ThemedText type="smallBold">{etiqueta}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.campo,
          { color: theme.text, borderColor: error ? '#d93025' : theme.textSecondary },
          style,
        ]}
        {...resto}
      />
      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: Spacing.one },
  campo: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: '#d93025' },
});