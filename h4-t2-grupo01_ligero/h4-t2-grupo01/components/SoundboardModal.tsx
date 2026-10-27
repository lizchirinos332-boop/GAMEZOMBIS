"use client";
import { useState, useEffect } from "react";
import { sonidos } from "@/lib/sonidos";

interface SoundboardModalProps {
  abierto: boolean;
  alCerrar: () => void;
}

export default function SoundboardModal({ abierto, alCerrar }: SoundboardModalProps) {
  const [silenciado, setSilenciado] = useState(false);
  const [volumen, setVolumen] = useState(80);
  const [sonidoActivo, setSonidoActivo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSilenciado(sonidos.estaSilenciado());
      setVolumen(Math.round(sonidos.obtenerVolumen() * 100));
    }
  }, [abierto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && abierto) alCerrar();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const alternarMute = () => {
    const nuevo = sonidos.alternarSilencio();
    setSilenciado(nuevo);
  };

  const cambiarVolumen = (nuevoVol: number) => {
    setVolumen(nuevoVol);
    sonidos.setVolumen(nuevoVol / 100);
    if (silenciado && nuevoVol > 0) {
      sonidos.alternarSilencio();
      setSilenciado(false);
    }
  };

  const reproducir = (nombre: string, accion: () => void) => {
    sonidos.iniciar();
    setSonidoActivo(nombre);
    accion();
    setTimeout(() => {
      setSonidoActivo((prev) => (prev === nombre ? null : prev));
    }, 450);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(3, 4, 7, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={alCerrar}
    >
      <div
        style={{
          background: "linear-gradient(160deg, #121016 0%, #0a0d0d 100%)",
          border: "2px solid var(--toxic-green)",
          boxShadow: "0 0 35px rgba(41, 243, 115, 0.25), 0 20px 50px rgba(0, 0, 0, 0.9)",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>🎙️</span>
              <h2 className="blood-title" style={{ fontSize: "1.4rem", margin: 0 }}>
                CONSOLA DE AUDIO Y EFECTOS
              </h2>
            </div>
            <p className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "0.82rem", marginTop: "4px" }}>
              SÍNTESIS PROCEDURAL WEB AUDIO · ESPACIALIZACIÓN 2D DINÁMICA
            </p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#fff",
              borderRadius: "6px",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Barra de control de volumen */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 183, 3, 0.3)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={alternarMute}
              className="btn-tactical-outline"
              style={{
                padding: "6px 12px",
                fontSize: "0.85rem",
                borderColor: silenciado ? "var(--blood-bright)" : "var(--toxic-green)",
                color: silenciado ? "var(--blood-bright)" : "var(--toxic-green)",
              }}
            >
              <span>{silenciado ? "🔇" : "🔊"}</span>
              <span>{silenciado ? "MUTED" : "ACTIVADO"}</span>
            </button>

            <span className="font-tech" style={{ fontSize: "0.85rem", color: "var(--hazard-yellow)" }}>
              NIVEL: {silenciado ? "0%" : `${volumen}%`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 200px", maxWidth: "260px" }}>
            <span style={{ fontSize: "0.8rem", color: "#888" }}>0%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={silenciado ? 0 : volumen}
              onChange={(e) => cambiarVolumen(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: "var(--toxic-green)",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: "0.8rem", color: "#888" }}>100%</span>
          </div>
        </div>

        {/* Sección 1: Zombis y Gritos */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>🧟</span>
            <h3 className="font-tech" style={{ color: "var(--blood-bright)", fontSize: "0.95rem", letterSpacing: "1px" }}>
              VOCALIZACIONES DE ZOMBIS Y GRITOS
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            <button
              type="button"
              onClick={() => reproducir("z_normal", () => sonidos.zombieGemido("normal", 480, 960))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "z_normal" ? "var(--toxic-green)" : "" }}
            >
              <span>🧟 Gemido Normal</span>
              <span className="sound-tag">Gutural</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("z_rapido", () => sonidos.zombieGemido("rapido", 480, 960))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "z_rapido" ? "var(--hazard-yellow)" : "" }}
            >
              <span>⚡ Chillido Rápido</span>
              <span className="sound-tag">Histérico</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("z_tanque", () => sonidos.zombieGemido("tanque", 480, 960))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "z_tanque" ? "var(--blood-bright)" : "" }}
            >
              <span>👹 Rugido Tanque</span>
              <span className="sound-tag">Sub-Bajo</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("z_muerte_norm", () => sonidos.zombieMuerte("normal", 480, 960))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "z_muerte_norm" ? "var(--blood-bright)" : "" }}
            >
              <span>💀 Muerte Zombi</span>
              <span className="sound-tag">Grito Agonía</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("z_muerte_rap", () => sonidos.zombieMuerte("rapido", 480, 960))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "z_muerte_rap" ? "var(--hazard-yellow)" : "" }}
            >
              <span>💀 Muerte Rápido</span>
              <span className="sound-tag">Chillido</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("z_muerte_tanq", () => sonidos.zombieMuerte("tanque", 480, 960))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "z_muerte_tanq" ? "var(--blood-bright)" : "" }}
            >
              <span>💀 Muerte Tanque</span>
              <span className="sound-tag">Colapso</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("j_danio", () => sonidos.jugadorDanio())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "j_danio" ? "var(--blood-bright)" : "" }}
            >
              <span>🩸 Grito Superviviente</span>
              <span className="sound-tag">Dolor ("¡Argh!")</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("z_ataque", () => sonidos.zombieAtaque())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "z_ataque" ? "var(--blood-bright)" : "" }}
            >
              <span>🥩 Mordisco / Ataque</span>
              <span className="sound-tag">Desgarro</span>
            </button>
          </div>
        </div>

        {/* Sección 2: Arsenal y Balística */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>🔫</span>
            <h3 className="font-tech" style={{ color: "var(--hazard-yellow)", fontSize: "0.95rem", letterSpacing: "1px" }}>
              ARSENAL Y BALÍSTICA
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            <button
              type="button"
              onClick={() => reproducir("d_pistola", () => sonidos.disparo("pistola"))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "d_pistola" ? "var(--hazard-yellow)" : "" }}
            >
              <span>🔫 Pistola 9mm</span>
              <span className="sound-tag">Seco y Ágil</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("d_escopeta", () => sonidos.disparo("escopeta"))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "d_escopeta" ? "var(--blood-bright)" : "" }}
            >
              <span>💥 Escopeta 12G</span>
              <span className="sound-tag">Explosión</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("d_rifle", () => sonidos.disparo("rifle"))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "d_rifle" ? "var(--toxic-green)" : "" }}
            >
              <span>⚡ Rifle Militar</span>
              <span className="sound-tag">Penetrante</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("b_impacto", () => sonidos.impactoBala(480, 960))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "b_impacto" ? "var(--blood-bright)" : "" }}
            >
              <span>🩸 Impacto Bala</span>
              <span className="sound-tag">Splat / Sangre</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("c_salud", () => sonidos.recogerSalud())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "c_salud" ? "var(--toxic-green)" : "" }}
            >
              <span>🩹 Botiquín Médico</span>
              <span className="sound-tag">Curación</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("c_municion", () => sonidos.recogerMunicion())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "c_municion" ? "var(--hazard-yellow)" : "" }}
            >
              <span>🎒 Munición</span>
              <span className="sound-tag">Cartuchos</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("a_desbloqueo", () => sonidos.desbloquearArma())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "a_desbloqueo" ? "var(--toxic-green)" : "" }}
            >
              <span>⚙️ Cerrojo / Carga</span>
              <span className="sound-tag">Chck-Clack</span>
            </button>
          </div>
        </div>

        {/* Sección 3: Atmósfera y Alertas */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>🚨</span>
            <h3 className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "0.95rem", letterSpacing: "1px" }}>
              ATMÓSFERA, ALERTAS Y TENSION
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
            <button
              type="button"
              onClick={() => reproducir("s_alerta", () => sonidos.alertaOleada(1))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "s_alerta" ? "var(--blood-bright)" : "" }}
            >
              <span>🚨 Sirena Oleada</span>
              <span className="sound-tag">Alarma Militar</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("s_completado", () => sonidos.nivelCompletado())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "s_completado" ? "var(--toxic-green)" : "" }}
            >
              <span>🎺 Oleada Superada</span>
              <span className="sound-tag">Victoria</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("s_latido", () => sonidos.actualizarLatido(15))}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "s_latido" ? "var(--blood-bright)" : "" }}
            >
              <span>❤️ Latido Cardíaco</span>
              <span className="sound-tag">Vida Crítica</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("s_gameover", () => sonidos.gameOver())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "s_gameover" ? "var(--blood-bright)" : "" }}
            >
              <span>☠️ Game Over</span>
              <span className="sound-tag">Abismo Fúnebre</span>
            </button>

            <button
              type="button"
              onClick={() => reproducir("s_victoria", () => sonidos.victoria())}
              className="btn-soundboard-item"
              style={{ borderColor: sonidoActivo === "s_victoria" ? "var(--toxic-green)" : "" }}
            >
              <span>🏆 Supervivencia Total</span>
              <span className="sound-tag">Fanfarria</span>
            </button>
          </div>
        </div>

        {/* Nota técnica */}
        <div
          style={{
            marginTop: "20px",
            padding: "10px 14px",
            background: "rgba(41, 243, 115, 0.08)",
            border: "1px dashed rgba(41, 243, 115, 0.3)",
            borderRadius: "8px",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          💡 <strong>Paneo espacial 2D activo:</strong> Durante la partida en vivo, los rugidos de zombis y los impactos se panean dinámicamente entre tu auricular izquierdo y derecho según su posición en la pantalla.
        </div>
      </div>
    </div>
  );
}
