"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { obtenerJugadorActivo, type Jugador } from "@/lib/jugadores";

export default function NavbarClient() {
  const [activo, setActivo] = useState<Jugador | null>(null);

  const refrescar = () => {
    setActivo(obtenerJugadorActivo());
  };

  useEffect(() => {
    refrescar();
    const handler = () => refrescar();
    window.addEventListener("zombie_auth_change", handler);
    return () => window.removeEventListener("zombie_auth_change", handler);
  }, []);

  const abrirAuth = (tab: "login" | "registro" = "registro") => {
    window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { tab } }));
  };

  const abrirPartida = (mode: "crear" | "unirme") => {
    window.dispatchEvent(new CustomEvent("open_partida_modal", { detail: { mode } }));
  };

  return (
    <nav className="nav">
      <div className="container">
        <Link href="/" className="brand">
          <span className="brand-biohazard">☣️</span>
          <span className="brand-name">ZOMBIE SURVIVAL</span>
        </Link>

        <div className="nav-links-wrapper">
          <Link href="/" className="nav-link">
            <span>🏚️</span> Búnker
          </Link>

          <Link href="/juego" className="nav-link nav-link-play">
            <span>⚔️</span> Jugar
          </Link>

          {/* Botones verdes rápidos de partida */}
          <button
            type="button"
            onClick={() => abrirPartida("crear")}
            className="nav-btn-green"
            title="Crear partida con código"
          >
            <span>🟢</span> Crear Sala
          </button>

          <button
            type="button"
            onClick={() => abrirPartida("unirme")}
            className="nav-btn-green-outline"
            title="Unirme a partida con código"
          >
            <span>🔗</span> Unirme
          </button>

          {/* Estado de autenticación */}
          {activo ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Link
                href={`/jugador/${activo.id}`}
                className="nav-link"
                style={{
                  borderColor: "var(--toxic-green)",
                  background: "rgba(41, 243, 115, 0.1)",
                  color: "#fff",
                }}
                title={`Ver expediente de ${activo.nombre}`}
              >
                <span>{activo.avatar || "🪖"}</span>
                <span>{activo.nombre}</span>
                <span className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "0.75rem" }}>
                  (Nv.{activo.nivel})
                </span>
              </Link>
              <button
                type="button"
                onClick={() => abrirAuth("login")}
                className="btn-tactical-outline"
                style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                title="Cambiar de perfil"
              >
                Perfil
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => abrirAuth("registro")}
              className="nav-btn-auth"
            >
              <span>👤</span> Iniciar Sesión / Registro
            </button>
          )}

          <div className="nav-status-beacon">
            <span className="beacon-dot" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
