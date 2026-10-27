"use client";
import { useState, useEffect } from "react";
import {
  obtenerJugadores,
  obtenerJugadorActivo,
  registrarJugador,
  establecerJugadorActivo,
  type Jugador,
} from "@/lib/jugadores";

export default function AuthModal() {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<"login" | "registro">("registro");
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [activo, setActivo] = useState<Jugador | null>(null);

  // Formulario registro
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("Asalto de Vanguardia");
  const [avatar, setAvatar] = useState("🪖");
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const AVATARES = ["🪖", "🎯", "👑", "☣️", "💀", "🐺", "⚡", "🛡️", "🔥", "🧟"];
  const ROLES = [
    "Asalto de Vanguardia",
    "Francotirador de Élite",
    "Médico de Combate",
    "Explorador Urbano",
    "Ingeniero de Fortificación",
  ];

  const refrescar = () => {
    setJugadores(obtenerJugadores());
    setActivo(obtenerJugadorActivo());
  };

  useEffect(() => {
    refrescar();

    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.tab) setTab(custom.detail.tab);
      setAbierto(true);
      refrescar();
    };

    const authChange = () => refrescar();

    window.addEventListener("open_auth_modal", handler);
    window.addEventListener("zombie_auth_change", authChange);

    return () => {
      window.removeEventListener("open_auth_modal", handler);
      window.removeEventListener("zombie_auth_change", authChange);
    };
  }, []);

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) {
      setError("Ingresa el nombre del superviviente.");
      return;
    }
    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    const nuevo = registrarJugador(nombre.trim(), rol, avatar);

    // Sincronizar con API en segundo plano
    fetch("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevo.nombre, rol: nuevo.rol, avatar: nuevo.avatar, jugador: nuevo }),
    }).catch(() => {});

    setExito(`¡Bienvenido al frente de batalla, ${nuevo.nombre}!`);
    setTimeout(() => {
      setExito("");
      setNombre("");
      setAbierto(false);
      refrescar();
    }, 1200);
  };

  const handleSeleccionar = (j: Jugador) => {
    establecerJugadorActivo(j);
    setExito(`Sesión iniciada como ${j.nombre}`);
    setTimeout(() => {
      setExito("");
      setAbierto(false);
      refrescar();
    }, 700);
  };

  const handleCerrarSesion = () => {
    establecerJugadorActivo(null);
    refrescar();
  };

  if (!abierto) return null;

  return (
    <div className="modal-backdrop" onClick={() => setAbierto(false)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setAbierto(false)} aria-label="Cerrar modal">
          ✕
        </button>

        <div className="modal-header">
          <div className="section-tag" style={{ marginBottom: "6px" }}>
            BASE DE DATOS DE RECLUTAMIENTO
          </div>
          <h3 className="blood-title" style={{ fontSize: "1.8rem" }}>
            IDENTIFICACIÓN DE SUPERVIVIENTES
          </h3>
          <p className="font-tech" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Inicia sesión o registra tu perfil de combatiente para guardar tus bajas y puntajes.
          </p>
        </div>

        {activo && (
          <div className="active-user-banner">
            <span style={{ fontSize: "1.5rem" }}>{activo.avatar || "🪖"}</span>
            <div>
              <div style={{ color: "#fff", fontWeight: "bold" }}>{activo.nombre}</div>
              <div className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "0.8rem" }}>
                {activo.rol} · {activo.puntaje} PTS · {activo.zombis} Zombis
              </div>
            </div>
            <button
              onClick={handleCerrarSesion}
              className="btn-tactical-outline"
              style={{ marginLeft: "auto", padding: "6px 12px", fontSize: "0.75rem" }}
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Pestañas */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${tab === "registro" ? "active" : ""}`}
            onClick={() => {
              setTab("registro");
              setError("");
              setExito("");
            }}
          >
            ➕ Registrar Nuevo Superviviente
          </button>
          <button
            type="button"
            className={`modal-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              setTab("login");
              setError("");
              setExito("");
            }}
          >
            👤 Supervivientes Registrados ({jugadores.length})
          </button>
        </div>

        {error && <div className="modal-alert error">{error}</div>}
        {exito && <div className="modal-alert success">{exito}</div>}

        {/* Tab Registro */}
        {tab === "registro" && (
          <form onSubmit={handleCrear} className="modal-form">
            <div className="form-group">
              <label className="form-label font-tech">NOMBRE O ALIAS DE COMBATE:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Alex Vance, Ghost, Cazador99..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={24}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label font-tech">ESPECIALIDAD TÁCTICA:</label>
              <select className="form-select" value={rol} onChange={(e) => setRol(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label font-tech">INSIGNIA / AVATAR:</label>
              <div className="avatar-picker">
                {AVATARES.map((av) => (
                  <button
                    key={av}
                    type="button"
                    className={`avatar-option ${avatar === av ? "selected" : ""}`}
                    onClick={() => setAvatar(av)}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-blood-primary" style={{ width: "100%", justifyContent: "center" }}>
              <span>🪖</span> REGISTRAR Y ALISTARME AL COMBATE
            </button>
          </form>
        )}

        {/* Tab Login / Selección */}
        {tab === "login" && (
          <div className="saved-players-list">
            {jugadores.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-muted)" }}>
                <p>No hay supervivientes registrados todavía.</p>
                <button
                  type="button"
                  onClick={() => setTab("registro")}
                  className="btn-blood-primary"
                  style={{ marginTop: "14px", padding: "10px 18px", fontSize: "0.9rem" }}
                >
                  Registrar mi primer superviviente
                </button>
              </div>
            ) : (
              jugadores.map((j) => (
                <div
                  key={j.id}
                  className={`player-item ${activo?.id === j.id ? "current" : ""}`}
                  onClick={() => handleSeleccionar(j)}
                >
                  <span style={{ fontSize: "1.6rem" }}>{j.avatar || "🪖"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", color: "#fff" }}>{j.nombre}</div>
                    <div className="font-tech" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {j.rol} · {j.puntaje} PTS · {j.zombis} Bajas
                    </div>
                  </div>
                  {activo?.id === j.id ? (
                    <span className="badge-active">ACTIVO</span>
                  ) : (
                    <span className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "0.8rem" }}>
                      Seleccionar ➔
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
