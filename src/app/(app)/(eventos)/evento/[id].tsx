import { Image } from 'expo-image';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { BotonFoto } from '@/components/boton-foto';
import { EstadoEventoBadge } from '@/components/estado-evento';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { confirmarRecepcion, fuenteImagen, listarFotos, obtenerEvento } from '@/lib/api';
import { ETIQUETA_TIPO, formatearFecha } from '@/lib/formato';
import { useDatos } from '@/lib/use-datos';

export default function DetalleEvento() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const cargadorEvento = useCallback(() => obtenerEvento(id), [id]);
  const cargadorFotos = useCallback(() => listarFotos(id), [id]);
  const eventoDatos = useDatos(cargadorEvento);
  const fotosDatos = useDatos(cargadorFotos);

  const [confirmando, setConfirmando] = useState(false);
  const [errorRecepcion, setErrorRecepcion] = useState<string | null>(null);

  const refrescarEvento = eventoDatos.refrescar;
  const refrescarFotos = fotosDatos.refrescar;
  const refrescarTodo = useCallback(async () => {
    await Promise.all([refrescarEvento(), refrescarFotos()]);
  }, [refrescarEvento, refrescarFotos]);

  // Los hooks van SIEMPRE arriba, antes de cualquier `return` condicional.
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      void refrescarTodo(); // al volver de agregar productos, tomar fotos, etc.
    }, [refrescarTodo]),
  );

  const evento = eventoDatos.datos;

  if (eventoDatos.cargando && evento === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (evento === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ThemedText style={styles.centrarTexto}>
          {eventoDatos.error ?? 'No se encontró el evento'}
        </ThemedText>
        <Pressable style={styles.boton} onPress={eventoDatos.recargar}>
          <ThemedText type="small">Reintentar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const fotos = fotosDatos.datos ?? [];
  const conDevolucion = evento.estado !== 'PLANEADO';
  const puedeEditar = evento.estado === 'PLANEADO';
  const aceptaFotosDeRecepcion = evento.estado === 'PLANEADO' || evento.estado === 'RECIBIDO';

  const tieneProductos = evento.items.length > 0;
  const tieneFotoRecepcion = fotos.some((f) => f.momento === 'RECEPCION');
  const listoParaRecibir = tieneProductos && tieneFotoRecepcion;

  function pedirConfirmacion() {
    Alert.alert(
      'Confirmar recepción',
      'Después de confirmar ya no podrás agregar, cambiar ni quitar productos. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void confirmar() },
      ],
    );
  }

  async function confirmar() {
    setConfirmando(true);
    setErrorRecepcion(null);
    try {
      await confirmarRecepcion(id);
      await refrescarTodo();
    } catch (e) {
      setErrorRecepcion(e instanceof Error ? e.message : 'No se pudo confirmar la recepción');
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: evento.nombre }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={eventoDatos.refrescando || fotosDatos.refrescando}
            onRefresh={refrescarTodo}
          />
        }>
        {eventoDatos.error !== null && (
          <ThemedText style={styles.aviso}>{eventoDatos.error}</ThemedText>
        )}

        <ThemedText type="subtitle">{evento.nombre}</ThemedText>
        <EstadoEventoBadge estado={evento.estado} />

        <ThemedView type="backgroundElement" style={styles.bloque}>
          <Dato etiqueta="Fecha" valor={formatearFecha(evento.fecha)} />
          <Dato etiqueta="Lugar" valor={evento.lugar ?? 'Sin lugar'} />
          <Dato etiqueta="Planeador" valor={evento.planeadorNombre} />
        </ThemedView>

        {/* ---------- Productos ---------- */}
        <View style={styles.encabezadoSeccion}>
          <ThemedText type="smallBold">Productos ({evento.items.length})</ThemedText>
          {puedeEditar && (
            <Pressable
              style={styles.botonAgregar}
              onPress={() =>
                router.push({ pathname: '/producto-evento', params: { eventoId: evento.id } })
              }>
              <ThemedText type="small" style={styles.textoAgregar}>
                + Agregar producto
              </ThemedText>
            </Pressable>
          )}
        </View>

        {evento.items.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Todavía no hay productos registrados.
          </ThemedText>
        )}
        {puedeEditar && evento.items.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Toca un producto para cambiar su cantidad, fotografiarlo o quitarlo.
          </ThemedText>
        )}

        {evento.items.map((item) => (
          <Pressable
            key={item.productoId}
            disabled={!puedeEditar}
            onPress={() =>
              router.push({
                pathname: '/producto-evento',
                params: { eventoId: evento.id, productoId: item.productoId },
              })
            }
            style={({ pressed }) => pressed && styles.pulsada}>
            <ThemedView type="backgroundElement" style={styles.bloque}>
              <ThemedText type="smallBold">{item.productoNombre}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {ETIQUETA_TIPO[item.tipo]} · Recibidas: {item.cantidadRecibida}
              </ThemedText>
              {item.observaciones !== null && (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.observaciones}
                </ThemedText>
              )}
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
          </Pressable>
        ))}

        {/* ---------- Evidencia ---------- */}
        <ThemedText type="smallBold">Fotos de evidencia ({fotos.length})</ThemedText>

        {aceptaFotosDeRecepcion && (
          <BotonFoto
            eventoId={evento.id}
            momento="RECEPCION"
            etiqueta="Tomar foto de recepción"
            alSubir={() => void refrescarFotos()}
          />
        )}

        {fotosDatos.error !== null && (
          <ThemedText type="small" style={styles.aviso}>
            No se pudieron cargar las fotos: {fotosDatos.error}
          </ThemedText>
        )}

        {fotos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.miniaturas}>
            {fotos.map((foto) => (
              <Pressable
                key={foto.id}
                onPress={() =>
                  router.push({
                    pathname: '/foto',
                    params: { eventoId: evento.id, fotoId: foto.id },
                  })
                }>
                <Image
                  source={fuenteImagen(foto.url)}
                  contentFit="cover"
                  style={styles.miniatura}
                />
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ---------- Confirmar la recepción ---------- */}
        {puedeEditar && (
          <ThemedView type="backgroundElement" style={styles.bloque}>
            <ThemedText type="smallBold">Para confirmar la recepción</ThemedText>
            <ThemedText type="small">
              {tieneProductos ? '✓' : '○'} Al menos un producto registrado
            </ThemedText>
            <ThemedText type="small">
              {tieneFotoRecepcion ? '✓' : '○'} Al menos una foto de recepción
            </ThemedText>

            {errorRecepcion !== null && (
              <ThemedText type="small" style={styles.aviso}>
                {errorRecepcion}
              </ThemedText>
            )}

            <Pressable
              style={[styles.botonPrimario, (!listoParaRecibir || confirmando) && styles.inactivo]}
              disabled={!listoParaRecibir || confirmando}
              onPress={pedirConfirmacion}>
              {confirmando ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText style={styles.textoBotonPrimario}>Confirmar recepción</ThemedText>
              )}
            </Pressable>
          </ThemedView>
        )}
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
  encabezadoSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  botonAgregar: {
    borderWidth: 1,
    borderColor: '#2f6fed',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  textoAgregar: { color: '#2f6fed' },
  pulsada: { opacity: 0.7 },
  miniaturas: { gap: Spacing.two },
  miniatura: { width: 96, height: 96, borderRadius: 12 },
  botonPrimario: {
    backgroundColor: '#2f6fed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  textoBotonPrimario: { color: '#ffffff', fontWeight: '600' },
  inactivo: { opacity: 0.5 },
});