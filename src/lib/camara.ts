import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { FotoLocal } from './api';

export type ResultadoCamara =
  | { tipo: 'foto'; foto: FotoLocal }
  | { tipo: 'cancelada' }
  | { tipo: 'sin-permiso'; puedePedirDeNuevo: boolean };

const LADO_MAXIMO = 1600; // píxeles del lado más largo
const CALIDAD = 0.7; // 0 a 1

/** Pide permiso, abre la cámara y devuelve la foto ya reducida y comprimida (JPEG). */
export async function tomarFoto(): Promise<ResultadoCamara> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    return { tipo: 'sin-permiso', puedePedirDeNuevo: permiso.canAskAgain };
  }

  const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (resultado.canceled) return { tipo: 'cancelada' };

  const tomadaEn = new Date();
  const original = resultado.assets[0];

  const contexto = ImageManipulator.manipulate(original.uri);
  if (Math.max(original.width, original.height) > LADO_MAXIMO) {
    contexto.resize(original.width >= original.height ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO });
  }
  const imagen = await contexto.renderAsync();
  const comprimida = await imagen.saveAsync({ compress: CALIDAD, format: SaveFormat.JPEG });

  return { tipo: 'foto', foto: { uri: comprimida.uri, tomadaEn } };
}