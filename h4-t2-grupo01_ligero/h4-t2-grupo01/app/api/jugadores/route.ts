import { NextResponse } from "next/server";
import { obtenerJugadores, registrarJugador, guardarListaJugadores } from "@/lib/jugadores";

export async function GET() {
  const lista = obtenerJugadores();
  return NextResponse.json({ jugadores: lista });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, rol, avatar, jugador } = body;

    if (jugador) {
      const lista = obtenerJugadores();
      const idx = lista.findIndex((j) => j.id === jugador.id);
      if (idx !== -1) {
        lista[idx] = jugador;
      } else {
        lista.unshift(jugador);
      }
      guardarListaJugadores(lista);
      return NextResponse.json({ ok: true, jugador });
    }

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json({ error: "Nombre de jugador requerido" }, { status: 400 });
    }

    const nuevo = registrarJugador(nombre, rol, avatar);
    return NextResponse.json({ ok: true, jugador: nuevo });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error procesando registro" }, { status: 500 });
  }
}
