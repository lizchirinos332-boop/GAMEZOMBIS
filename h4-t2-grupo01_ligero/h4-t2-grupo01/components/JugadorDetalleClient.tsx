"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { buscarJugador, type Jugador } from "@/lib/jugadores";

export default function JugadorDetalleClient({ id }: { id: string }) {
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    // 1. Buscar en localStorage / memoria local
    const local = buscarJugador(id);
    if (local) {
      setJugador(local);
      setCargado(true);
      return;
    }

    // 2. Buscar en API
    fetch("/api/jugadores")
      .then((res) => res.json())
      .then((data) => {
        const encontrado = (data.jugadores as Jugador[] || []).find(
          (j) => j.id === id || j.id.toLowerCase() === id.toLowerCase()
        );
        if (encontrado) setJugador(encontrado);
        setCargado(true);
      })
      .catch(() => setCargado(true));
  }, [id]);

  if (!cargado) {
    return (
      <div className="stat-card" style={{ padding: "40px", textAlign: "center" }}>
        <p className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "1.1rem" }}>
          ⏳ Desencriptando expediente clasificado #{id}...
        </p>
      </div>
    );
  }

  if (!jugador) {
    return (
      <div className="dossier-card" style={{ textAlign: "center", padding: "50px 20px" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>☣️ 💀</div>
        <h1 className="blood-title" style={{ fontSize: "2rem", marginBottom: "14px" }}>
          SUPERVIVIENTE NO ENCONTRADO
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto 24px" }}>
          No existe registro militar o biológico para el identificador <strong>#{id}</strong>.
          Regístrate o inicia sesión con tu combatiente para crear tu expediente.
        </p>
        <div style={{ display: "inline-flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: { tab: "registro" } }))}
            className="btn-blood-primary"
          >
            <span>🪖</span> Registrar Nuevo Superviviente
          </button>
          <Link href="/" className="btn-tactical-outline">
            <span>🏚️</span> Volver al Búnker
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dossier-card">
      <div className="dossier-stamp">EXPEDIENTE #{jugador.id}</div>

      <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "24px" }}>
        <div className="survivor-avatar" style={{ width: "68px", height: "68px", fontSize: "2.2rem" }}>
          {jugador.avatar || "🪖"}
        </div>
        <div>
          <span className="section-tag">DOSSIER MILITAR CLASIFICADO</span>
          <h1 className="horror-heading" style={{ fontSize: "2.5rem", margin: "4px 0" }}>
            {jugador.nombre}
          </h1>
          <p className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "0.95rem" }}>
            ROL TÁCTICO: {jugador.rol || "Recluta de Vanguardia"}
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-label">
            <span>🏆</span> Puntuación Acumulada
          </div>
          <div className="stat-value stat-value-hazard">{(jugador.puntaje || 0).toLocaleString()} PTS</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>🛡️</span> Máxima Horda Sobrevivida
          </div>
          <div className="stat-value">NIVEL {jugador.nivel || 1} / 5</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>💀</span> Zombis Aniquilados
          </div>
          <div className="stat-value stat-value-blood">{jugador.zombis || 0} CADÁVERES</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>🎮</span> Misiones de Combate
          </div>
          <div className="stat-value" style={{ color: "#fff" }}>{jugador.partidas || 0} PARTIDAS</div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          padding: "16px 20px",
          borderRadius: "8px",
          border: "1px dashed rgba(255, 23, 68, 0.3)",
          marginBottom: "24px",
        }}
      >
        <h4 className="font-tech" style={{ color: "var(--hazard-yellow)", marginBottom: "6px" }}>
          ESTADO DEL COMBATIENTE: EN SERVICIO ACTIVO
        </h4>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>
          Superviviente dado de alta en la red de defensa. Sus bajas y oleadas se registran automáticamente
          cada vez que juega en la zona de combate <code>/juego</code>.
        </p>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <Link href="/juego" className="btn-blood-primary">
          <span>⚔️</span> Desplegar en Zona de Guerra (/juego)
        </Link>
        <Link href="/" className="btn-tactical-outline">
          <span>🏚️</span> ← Volver al Búnker (Inicio)
        </Link>
      </div>
    </div>
  );
}
