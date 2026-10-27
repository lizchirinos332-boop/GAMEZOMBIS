export type Jugador = {
  id: string;
  nombre: string;
  rol: string;
  avatar: string;
  puntaje: number;
  nivel: number;
  zombis: number;
  partidas: number;
  creadoEn: string;
};

// Almacén en memoria del servidor (para cuando corre en Node / SSR)
let jugadoresEnMemoria: Jugador[] = [];

const STORAGE_KEY = "zombie_survival_jugadores";
const CURRENT_PLAYER_KEY = "zombie_survival_jugador_activo";

// Obtener todos los jugadores registrados (cliente o servidor)
export function obtenerJugadores(): Jugador[] {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as Jugador[];
        // Mantener sincronizado
        jugadoresEnMemoria = parsed;
        return parsed;
      }
    } catch {
      // Si localStorage no está disponible
    }
  }
  return jugadoresEnMemoria;
}

// Buscar jugador por ID
export function buscarJugador(id: string): Jugador | undefined {
  const lista = obtenerJugadores();
  return lista.find((j) => j.id === id || j.id.toLowerCase() === id.toLowerCase());
}

// Registrar o actualizar un jugador real
export function registrarJugador(nombre: string, rol = "Recluta Táctico", avatar = "🪖"): Jugador {
  const lista = obtenerJugadores();
  const id = nombre
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-") || `agente-${Date.now().toString().slice(-4)}`;

  // Si ya existe uno con este ID/nombre, retornar el existente
  const existente = lista.find((j) => j.id === id || j.nombre.toLowerCase() === nombre.trim().toLowerCase());
  if (existente) {
    establecerJugadorActivo(existente);
    return existente;
  }

  const nuevo: Jugador = {
    id,
    nombre: nombre.trim(),
    rol,
    avatar,
    puntaje: 0,
    nivel: 1,
    zombis: 0,
    partidas: 0,
    creadoEn: new Date().toISOString(),
  };

  const actualizada = [nuevo, ...lista];
  guardarListaJugadores(actualizada);
  establecerJugadorActivo(nuevo);
  return nuevo;
}

// Guardar lista en storage y memoria
export function guardarListaJugadores(lista: Jugador[]) {
  jugadoresEnMemoria = lista;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch {
      // ignore
    }
  }
}

// Obtener jugador actualmente logueado en la sesión
export function obtenerJugadorActivo(): Jugador | null {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem(CURRENT_PLAYER_KEY);
      if (data) return JSON.parse(data) as Jugador;
    } catch {
      // ignore
    }
  }
  return null;
}

// Establecer jugador activo
export function establecerJugadorActivo(jugador: Jugador | null) {
  if (typeof window !== "undefined") {
    try {
      if (jugador) {
        localStorage.setItem(CURRENT_PLAYER_KEY, JSON.stringify(jugador));
      } else {
        localStorage.removeItem(CURRENT_PLAYER_KEY);
      }
      window.dispatchEvent(new Event("zombie_auth_change"));
    } catch {
      // ignore
    }
  }
}

// Actualizar estadísticas tras una partida en /juego
export function registrarResultadoPartida(puntaje: number, nivel: number, zombis: number) {
  const activo = obtenerJugadorActivo();
  if (!activo) return;

  const lista = obtenerJugadores();
  const idx = lista.findIndex((j) => j.id === activo.id);
  if (idx !== -1) {
    const jugador = lista[idx];
    jugador.partidas = (jugador.partidas || 0) + 1;
    jugador.puntaje = Math.max(jugador.puntaje, puntaje);
    jugador.nivel = Math.max(jugador.nivel, nivel);
    jugador.zombis += zombis;

    lista[idx] = jugador;
    guardarListaJugadores(lista);
    establecerJugadorActivo(jugador);
  }
}
