import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/campo-texto';
import { SelectorFecha } from '@/components/selector-fecha';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { crearEvento, crearPlaneador, listarPlaneadores } from '@/lib/api';
import { aIsoLocal } from '@/lib/formato';
import { useDatos } from '@/lib/use-datos';
import { validarEvento } from '@/lib/validacion-evento';

export default function NuevoEvento() {
    const router = useRouter();
    const theme = useTheme();
    const planeadores = useDatos(listarPlaneadores);

    const [nombre, setNombre] = useState('');
    const [lugar, setLugar] = useState('');
    const [fecha, setFecha] = useState(() => new Date());
    const [planeadorId, setPlaneadorId] = useState<string | null>(null);
    const [intentoEnvio, setIntentoEnvio] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

    const [nuevoPlaneador, setNuevoPlaneador] = useState('');
    const [agregando, setAgregando] = useState(false);
    const [errorPlaneador, setErrorPlaneador] = useState<string | null>(null);

    // Estado derivado: se calcula en cada render, no se guarda.
    const errores = validarEvento({ nombre, lugar, planeadorId });

    async function enviar() {
        if (enviando) return;
        setIntentoEnvio(true);
        if (Object.keys(errores).length > 0 || planeadorId === null) return;

        setEnviando(true);
        setErrorEnvio(null);
        try {
            await crearEvento({
                planeadorId,
                nombre: nombre.trim(),
                lugar: lugar.trim() || null,
                fecha: aIsoLocal(fecha),
            });
            // Tras el éxito no se vuelve a habilitar el botón: el modal se está cerrando.
            router.back();
        } catch (e) {
            setErrorEnvio(e instanceof Error ? e.message : 'Error desconocido');
            setEnviando(false);
        }
    }

    async function agregarPlaneador() {
        const limpio = nuevoPlaneador.trim();
        if (limpio.length === 0 || agregando) return;

        setAgregando(true);
        setErrorPlaneador(null);
        try {
            const creado = await crearPlaneador(limpio);
            await planeadores.recargar();
            setPlaneadorId(creado.id);
            setNuevoPlaneador('');
        } catch (e) {
            setErrorPlaneador(e instanceof Error ? e.message : 'Error desconocido');
        } finally {
            setAgregando(false);
        }
    }

    return (
        <ScrollView
            contentContainerStyle={styles.contenido}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets>
            <CampoTexto
                etiqueta="Nombre del evento"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Boda Pérez"
                maxLength={200}
                returnKeyType="next"
                editable={!enviando}
                error={intentoEnvio ? errores.nombre : null}
            />

            <CampoTexto
                etiqueta="Lugar (opcional)"
                value={lugar}
                onChangeText={setLugar}
                placeholder="Finca El Mirador"
                maxLength={200}
                editable={!enviando}
                error={intentoEnvio ? errores.lugar : null}
            />

            <SelectorFecha etiqueta="Fecha" valor={fecha} onChange={setFecha} />

            <View style={styles.seccion}>
                <ThemedText type="smallBold">Planeador</ThemedText>

                {planeadores.cargando && planeadores.datos === null && <ActivityIndicator />}

                {planeadores.error !== null && planeadores.datos === null && (
                    <>
                        <ThemedText type="small" style={styles.error}>
                            {planeadores.error}
                        </ThemedText>
                        <Pressable style={styles.botonSecundario} onPress={planeadores.recargar}>
                            <ThemedText type="small">Reintentar</ThemedText>
                        </Pressable>
                    </>
                )}

                {planeadores.datos !== null && planeadores.datos.length === 0 && (
                    <ThemedText type="small" themeColor="textSecondary">
                        Aún no hay planeadores. Agrega el primero abajo.
                    </ThemedText>
                )}

                {planeadores.datos?.map((p) => {
                    const seleccionado = p.id === planeadorId;
                    return (
                        <Pressable
                            key={p.id}
                            onPress={() => setPlaneadorId(p.id)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: seleccionado }}
                            style={[
                                styles.opcion,
                                { backgroundColor: theme.backgroundElement },
                                seleccionado && styles.opcionSeleccionada,
                            ]}>
                            <ThemedText>{p.nombre}</ThemedText>
                            {seleccionado && <ThemedText>✓</ThemedText>}
                        </Pressable>
                    );
                })}

                {intentoEnvio && errores.planeador !== undefined && (
                    <ThemedText type="small" style={styles.error}>
                        {errores.planeador}
                    </ThemedText>
                )}

                <CampoTexto
                    etiqueta="¿No está en la lista? Agrégalo"
                    value={nuevoPlaneador}
                    onChangeText={setNuevoPlaneador}
                    placeholder="Nombre del planeador"
                    maxLength={150}
                    editable={!agregando}
                />
                <Pressable
                    style={[styles.botonSecundario, agregando && styles.inactivo]}
                    onPress={agregarPlaneador}
                    disabled={agregando}>
                    <ThemedText type="small">{agregando ? 'Agregando…' : 'Agregar planeador'}</ThemedText>
                </Pressable>
                {errorPlaneador !== null && (
                    <ThemedText type="small" style={styles.error}>
                        {errorPlaneador}
                    </ThemedText>
                )}
            </View>

            {errorEnvio !== null && <ThemedText style={styles.error}>{errorEnvio}</ThemedText>}

            <Pressable
                style={[styles.botonPrimario, enviando && styles.inactivo]}
                onPress={enviar}
                disabled={enviando}>
                {enviando ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <ThemedText style={styles.textoBotonPrimario}>Crear evento</ThemedText>
                )}
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contenido: { padding: Spacing.four, gap: Spacing.three },
    seccion: { gap: Spacing.two },
    opcion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.three,
        borderRadius: Spacing.three,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    opcionSeleccionada: { borderColor: '#2f6fed' },
    error: { color: '#d93025' },
    botonPrimario: {
        backgroundColor: '#2f6fed',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    textoBotonPrimario: { color: '#ffffff', fontWeight: '600' },
    botonSecundario: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: Spacing.two,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    inactivo: { opacity: 0.5 },
});