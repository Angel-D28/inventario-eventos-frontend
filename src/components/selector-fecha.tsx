import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { aIsoLocal, formatearFecha } from '@/lib/formato';

type Props = {
    etiqueta: string;
    valor: Date;
    onChange: (fecha: Date) => void;
};

export function SelectorFecha({ etiqueta, valor, onChange }: Props) {
    const theme = useTheme();

    function abrirEnAndroid() {
        DateTimePickerAndroid.open({
            value: valor,
            mode: 'date',
            onChange: (evento, fecha) => {
                if (evento.type === 'set' && fecha) onChange(fecha);
            },
        });
    }

    return (
        <View style={styles.contenedor}>
            <ThemedText type="smallBold">{etiqueta}</ThemedText>

            {Platform.OS === 'ios' ? (
                <View style={styles.filaIos}>
                    <DateTimePicker
                        value={valor}
                        mode="date"
                        display="compact"
                        onChange={(_, fecha) => {
                            if (fecha) onChange(fecha);
                        }}
                    />
                </View>
            ) : (
                <Pressable
                    onPress={abrirEnAndroid}
                    style={[styles.botonAndroid, { borderColor: theme.textSecondary }]}>
                    <ThemedText>{formatearFecha(aIsoLocal(valor))}</ThemedText>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: { gap: Spacing.one },
    filaIos: { alignItems: 'flex-start' },
    botonAndroid: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: 12,
    },
});