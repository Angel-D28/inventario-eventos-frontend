import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/campo-texto';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  crearProducto,
  listarProductos,
  obtenerEvento,
  quitarItem,
  registrarItem,
  type EventoItem,
  type Producto,
  type TipoProducto,
} from '@/lib/api';
import { parsearCantidad } from '@/lib/cantidad';
import { ETIQUETA_TIPO, normalizar } from '@/lib/formato';
import { useDatos } from '@/lib/use-datos';

const TIPOS: TipoProducto[] = ['LICOR', 'MENAJE', 'CRISTALERIA'];
const MAX_RESULTADOS = 30;

export default function ProductoDelEvento() {
  const router = useRouter();
  const { eventoId, productoId: productoInicial } = useLocalSearchParams<{
    eventoId: string;
    productoId?: string;
  }>();

  const cargadorEvento = useCallback(() => obtenerEvento(eventoId), [eventoId]);
  const evento = useDatos(cargadorEvento);
  const catalogo = useDatos(listarProductos);

  const [productoId, setProductoId] = useState<string | null>(productoInicial ?? null);
  const modoEdicion = productoInicial !== undefined;

  if ((evento.cargando && evento.datos === null) || (catalogo.cargando && catalogo.datos === null)) {
    return (
      <ThemedView style={styles.centrado}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (evento.datos === null || catalogo.datos === null) {
    return (
      <ThemedView style={styles.centrado}>
        <ThemedText style={styles.centrarTexto}>
          {evento.error ?? catalogo.error ?? 'No se pudieron cargar los datos'}
        </ThemedText>
        <Pressable
          style={styles.botonSecundario}
          onPress={() => {
            void evento.recargar();
            void catalogo.recargar();
          }}>
          <ThemedText type="small">Reintentar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (evento.datos.estado !== 'PLANEADO') {
    return (
      <ThemedView style={styles.centrado}>
        <ThemedText style={styles.centrarTexto}>
          Este evento ya no admite cambios en sus productos.
        </ThemedText>
        <Pressable style={styles.botonSecundario} onPress={() => router.back()}>
          <ThemedText type="small">Cerrar</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const item = evento.datos.items.find((i) => i.productoId === productoId) ?? null;
  // Un producto desactivado ya no sale en el catálogo, pero puede seguir en el evento.
  const producto: Producto | null =
    catalogo.datos.find((p) => p.id === productoId) ??
    (item
      ? {
          id: item.productoId,
          nombre: item.productoNombre,
          tipo: item.tipo,
          fotoUrl: null,
          activo: false,
        }
      : null);

  if (producto === null) {
    return (
      <Buscador
        productos={catalogo.datos}
        enEvento={new Set(evento.datos.items.map((i) => i.productoId))}
        recargarCatalogo={catalogo.recargar}
        onElegir={setProductoId}
      />
    );
  }

  return (
    <FormularioCantidad
      key={producto.id}
      eventoId={eventoId}
      producto={producto}
      item={item}
      modoEdicion={modoEdicion}
      onCambiar={modoEdicion ? undefined : () => setProductoId(null)}
      onTerminar={() => router.back()}
    />
  );
}

// ---------- Paso 1: elegir (o crear) el producto ----------

function Buscador({
  productos,
  enEvento,
  recargarCatalogo,
  onElegir,
}: {
  productos: Producto[];
  enEvento: Set<string>;
  recargarCatalogo: () => Promise<void>;
  onElegir: (productoId: string) => void;
}) {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consulta = normalizar(busqueda);
  const filtrados = productos.filter(
    (p) => consulta === '' || normalizar(p.nombre).includes(consulta),
  );
  const hayExacto = productos.some((p) => normalizar(p.nombre) === consulta);
  const puedeCrear = busqueda.trim().length > 0 && !hayExacto;

  async function crear(tipo: TipoProducto) {
    if (creando) return;
    setCreando(true);
    setError(null);
    try {
      const nuevo = await crearProducto({ nombre: busqueda.trim(), tipo });
      await recargarCatalogo();
      onElegir(nuevo.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCreando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <CampoTexto
        etiqueta="Buscar en el catálogo"
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Copa, ron, plato…"
        maxLength={150}
        autoCorrect={false}
        autoFocus
      />

      {filtrados.slice(0, MAX_RESULTADOS).map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onElegir(p.id)}
          style={[styles.opcion, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.opcionTexto}>
            <ThemedText>{p.nombre}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {ETIQUETA_TIPO[p.tipo]}
              {enEvento.has(p.id) ? ' · ya está en el evento' : ''}
            </ThemedText>
          </View>
        </Pressable>
      ))}

      {filtrados.length > MAX_RESULTADOS && (
        <ThemedText type="small" themeColor="textSecondary">
          Hay más resultados: sigue escribiendo para acotar la lista.
        </ThemedText>
      )}
      {filtrados.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Ningún producto coincide con «{busqueda.trim()}».
        </ThemedText>
      )}

      {puedeCrear && (
        <View style={styles.seccion}>
          <ThemedText type="smallBold">Crear «{busqueda.trim()}» como:</ThemedText>
          <View style={styles.filaBotones}>
            {TIPOS.map((tipo) => (
              <Pressable
                key={tipo}
                style={[styles.botonSecundario, creando && styles.inactivo]}
                disabled={creando}
                onPress={() => crear(tipo)}>
                <ThemedText type="small">{ETIQUETA_TIPO[tipo]}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {error !== null && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}
    </ScrollView>
  );
}

// ---------- Paso 2: cantidad y observaciones ----------

function FormularioCantidad({
  eventoId,
  producto,
  item,
  modoEdicion,
  onCambiar,
  onTerminar,
}: {
  eventoId: string;
  producto: Producto;
  item: EventoItem | null;
  modoEdicion: boolean;
  onCambiar?: () => void;
  onTerminar: () => void;
}) {
  // Estado inicial a partir del producto que ya está en el evento (si lo hay).
  const [cantidad, setCantidad] = useState(item ? String(item.cantidadRecibida) : '');
  const [observaciones, setObservaciones] = useState(item?.observaciones ?? '');
  const [intento, setIntento] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valor = parsearCantidad(cantidad);
  const errorCantidad = valor === null ? 'Escribe una cantidad mayor que cero' : null;

  async function guardar() {
    setIntento(true);
    if (valor === null || trabajando) return;
    setTrabajando(true);
    setError(null);
    try {
      await registrarItem(eventoId, producto.id, valor, observaciones.trim() || null);
      onTerminar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setTrabajando(false);
    }
  }

  async function quitar() {
    setTrabajando(true);
    setError(null);
    try {
      await quitarItem(eventoId, producto.id);
      onTerminar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setTrabajando(false);
    }
  }

  function confirmarQuitar() {
    Alert.alert('Quitar producto', `¿Quitar «${producto.nombre}» de este evento?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => void quitar() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <ThemedView type="backgroundElement" style={styles.cabecera}>
        <ThemedText type="subtitle">{producto.nombre}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {ETIQUETA_TIPO[producto.tipo]}
        </ThemedText>
        {onCambiar && (
          <Pressable onPress={onCambiar} hitSlop={8}>
            <ThemedText type="link">Cambiar producto</ThemedText>
          </Pressable>
        )}
      </ThemedView>

      {item !== null && !modoEdicion && (
        <ThemedText type="small" themeColor="textSecondary">
          Este producto ya está en el evento: al guardar se actualizará su cantidad.
        </ThemedText>
      )}

      <CampoTexto
        etiqueta="Cantidad recibida"
        value={cantidad}
        onChangeText={(texto) => setCantidad(texto.replace(/\D/g, ''))}
        placeholder="0"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        editable={!trabajando}
        error={intento ? errorCantidad : null}
      />

      <CampoTexto
        etiqueta="Observaciones (opcional)"
        value={observaciones}
        onChangeText={setObservaciones}
        placeholder="Ej.: 2 llegaron con marca"
        maxLength={500}
        multiline
        style={styles.multilinea}
        editable={!trabajando}
      />

      {error !== null && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Pressable
        style={[styles.botonPrimario, trabajando && styles.inactivo]}
        onPress={guardar}
        disabled={trabajando}>
        {trabajando ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <ThemedText style={styles.textoBotonPrimario}>Guardar</ThemedText>
        )}
      </Pressable>

      {item !== null && (
        <Pressable
          style={[styles.botonPeligro, trabajando && styles.inactivo]}
          onPress={confirmarQuitar}
          disabled={trabajando}>
          <ThemedText style={styles.textoPeligro}>Quitar del evento</ThemedText>
        </Pressable>
      )}
    </ScrollView>
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
  contenido: { padding: Spacing.four, gap: Spacing.three },
  seccion: { gap: Spacing.two },
  filaBotones: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  opcionTexto: { flex: 1, gap: 2 },
  cabecera: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  multilinea: { minHeight: 90, textAlignVertical: 'top' },
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
  botonPeligro: {
    borderWidth: 1,
    borderColor: '#d93025',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoPeligro: { color: '#d93025' },
  inactivo: { opacity: 0.5 },
});