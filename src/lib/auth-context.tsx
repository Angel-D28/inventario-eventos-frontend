import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
  } from 'react';
  
  import { establecerToken, iniciarSesionApi, registrarAlExpirar } from './api';
  import { borrarSesion, guardarSesion, leerSesion } from './sesion';
  
  type EstadoSesion = 'cargando' | 'sin-sesion' | 'con-sesion';
  
  type AuthContexto = {
    estado: EstadoSesion;
    iniciarSesion: (usuario: string, contrasena: string) => Promise<void>;
    cerrarSesion: () => Promise<void>;
  };
  
  const AuthContext = createContext<AuthContexto | null>(null);
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [estado, setEstado] = useState<EstadoSesion>('cargando');
  
    const cerrarSesion = useCallback(async () => {
      // Primero la memoria y la pantalla; el borrado del almacenamiento puede fallar sin impedir la salida.
      establecerToken(null);
      setEstado('sin-sesion');
      try {
        await borrarSesion();
      } catch {
        // Ya salió de la sesión en memoria.
      }
    }, []);
  
    useEffect(() => {
      registrarAlExpirar(() => {
        void cerrarSesion();
      });
  
      let cancelado = false;
      (async () => {
        try {
          const guardada = await leerSesion();
          if (cancelado) return;
          if (guardada) {
            establecerToken(guardada.token);
            setEstado('con-sesion');
            return;
          }
        } catch {
          // El almacenamiento seguro no respondió: se trata como sin sesión.
        }
        if (!cancelado) setEstado('sin-sesion');
      })();
  
      return () => {
        cancelado = true;
      };
    }, [cerrarSesion]);
  
    const iniciarSesion = useCallback(async (usuario: string, contrasena: string) => {
      const respuesta = await iniciarSesionApi(usuario, contrasena);
      await guardarSesion(respuesta.accessToken, respuesta.expiresIn);
      establecerToken(respuesta.accessToken);
      setEstado('con-sesion');
    }, []);
  
    const valor = useMemo(
      () => ({ estado, iniciarSesion, cerrarSesion }),
      [estado, iniciarSesion, cerrarSesion],
    );
  
    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
  }
  
  export function useAuth(): AuthContexto {
    const contexto = useContext(AuthContext);
    if (!contexto) {
      throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    }
    return contexto;
  }