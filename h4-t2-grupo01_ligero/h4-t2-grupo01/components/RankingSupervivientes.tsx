"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { obtenerJugadores, type Jugador } from "@/lib/jugadores";

export default function RankingSupervivientes() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [cargado, setCargado] = useState(false);

  const refrescar = () => {
    // Primero intentar desde localStorage/memoria local
    const locales = obtenerJugadores();
    if (locales.length > 0) {
      setJugadores(locales);
      setCargado(true);
    }

    // Sincronizar también con la API
    fetch("/api/jugadores")
      .then((res) => res.json())
      .then((data) => {
        if (data.jugadores && data.jugadores.length > 0) {
          setJugadores(data.jugadores);
        }
        setCargado(true);
      })
      .catch(() => {
        setCargado(true);
      });
  };

  useEffect(() => {
    refrescar();
    const handler = () => refrescar();
    window.addEventListener("zombie_auth_change", handler);
    return () => window.removeEventListener("zombie_auth_change", handler);
  }, []);

  const abrirRegistro = () => {
    window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { tab: "registro" } }));
  };

  if (!cargado) {
    return (
      <div className="stat-card" style={{ padding: "30px", textAlign: "center" }}>
        <p className="font-tech" style={{ color: "var(--toxic-green)" }}>
          ⏳ Conectando con los registros de la base de datos de supervivientes...
        </p>
      </div>
    );
  }

  if (jugadores.length === 0) {
    return (
      <div
        className="dossier-card"
        style={{
          textAlign: "center",
          padding: "40px 24px",
          background: "linear-gradient(145deg, rgba(20, 16, 24, 0.9), rgba(12, 10, 14, 0.9))",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🪖 ☣️</div>
        <h3 className="blood-title" style={{ fontSize: "1.6rem", marginBottom: "10px" }}>
          REGISTRO DE SUPERVIVIENTES DISPONIBLE
        </h3>
        <p style={{ color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto 24px", lineHeight: "1.6" }}>
          Aún no se han registrado supervivientes en este puesto avanzado. Inicia sesión o registra tu nombre para
          inaugurar el salón de combate y figurar con tu propia puntuación y rango en tiempo real.
        </p>
        <button
          type="button"
          onClick={abrirRegistro}
          className="btn-blood-primary"
          style={{ display: "inline-flex", margin: "0 auto" }}
        >
          <span>➕</span> REGISTRAR MI SUPERVIVIENTE AHORA
        </button>
      </div>
    );
  }

  // Ordenar por puntaje descendente
  const ordenados = [...jugadores].sort((a, b) => (b.puntaje || 0) - (a.puntaje || 0));

  return (
    <div className="survivors-grid">
      {ordenados.map((j, index) => {
        const medal = index === 0 ? "🥇 LÍDER SUPREMO" : index === 1 ? "🥈 VETERANO ALFA" : index === 2 ? "🥉 COMBATIENTE BRAVO" : `#${index + 1} ESCUADRÓN`;
        return (
          <Link
            key={j.id}
            href={`/jugador/${j.id}`}
            className="survivor-card"
            title={`Ver expediente completo de ${j.nombre}`}
          >
            <span className="survivor-badge-rank">{medal}</span>

            <div className="survivor-header">
              <div className="survivor-avatar">{j.avatar || "🪖"}</div>
              <div className="survivor-info">
                <h3>{j.nombre}</h3>
                <span className="survivor-status-tag">{j.rol || "Combatiente Activo"}</span>
              </div>
            </div>

            <div className="survivor-stats-rows">
              <div className="survivor-row">
                <span>Récord de Puntuación:</span>
                <strong style={{ color: "var(--hazard-yellow)" }}>
                  {(j.puntaje || 0).toLocaleString()} PTS
                </strong>
              </div>
              <div className="survivor-row">
                <span>Oleada Máxima:</span>
                <strong style={{ color: "#fff" }}>NIVEL {j.nivel || 1} / 5</strong>
              </div>
              <div className="survivor-row">
                <span>Zombis Exterminados:</span>
                <strong style={{ color: "var(--blood-bright)" }}>
                  {j.zombis || 0} CADÁVERES
                </strong>
              </div>
            </div>

            <div className="survivor-footer-action">
              <span>Ruta Dinámica: /jugador/{j.id}</span>
              <span>Abrir Dossier ➔</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
