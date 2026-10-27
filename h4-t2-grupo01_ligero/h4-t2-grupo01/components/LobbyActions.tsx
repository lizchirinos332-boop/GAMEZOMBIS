"use client";
import Link from "next/link";

export default function LobbyActions() {
  const abrirPartida = (mode: "crear" | "unirme") => {
    window.dispatchEvent(new CustomEvent("open_partida_modal", { detail: { mode } }));
  };

  const abrirAuth = () => {
    window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { tab: "registro" } }));
  };

  return (
    <div className="hero-cta-group">
      {/* Botón Principal Rojo de Jugar */}
      <Link href="/juego" className="btn-blood-primary">
        <span>💀</span> JUGAR SOLO (/juego) ➔
      </Link>

      {/* BOTÓN VERDE 1: CREAR PARTIDA */}
      <button
        type="button"
        onClick={() => abrirPartida("crear")}
        className="btn-green-primary"
      >
        <span>🟢</span> CREAR PARTIDA
      </button>

      {/* BOTÓN VERDE 2: UNIRME A PARTIDA */}
      <button
        type="button"
        onClick={() => abrirPartida("unirme")}
        className="btn-green-secondary"
      >
        <span>🔗</span> UNIRME A PARTIDA
      </button>

      {/* Botón Iniciar Sesión / Registro */}
      <button
        type="button"
        onClick={abrirAuth}
        className="btn-tactical-outline"
      >
        <span>👤</span> Iniciar Sesión / Registro
      </button>
    </div>
  );
}
