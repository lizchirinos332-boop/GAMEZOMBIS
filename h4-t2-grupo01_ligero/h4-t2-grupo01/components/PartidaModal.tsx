"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PartidaModal() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<"crear" | "unirme">("crear");
  const [codigoSala, setCodigoSala] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState("");

  const generarCodigo = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SURV-${code}`;
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const m = custom.detail?.mode || "crear";
      setModo(m);
      if (m === "crear") {
        setCodigoSala(generarCodigo());
      }
      setCodigoIngresado("");
      setCopiado(false);
      setError("");
      setAbierto(true);
    };

    window.addEventListener("open_partida_modal", handler);
    return () => window.removeEventListener("open_partida_modal", handler);
  }, []);

  const obtenerUrlInvitacion = () => {
    if (typeof window === "undefined") return `/juego?sala=${codigoSala}`;
    return `${window.location.origin}/juego?sala=${codigoSala}`;
  };

  const handleCopiar = async () => {
    const url = obtenerUrlInvitacion();
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleEntrarCreada = () => {
    setAbierto(false);
    router.push(`/juego?sala=${codigoSala}`);
  };

  const handleUnirse = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const input = codigoIngresado.trim();
    if (!input) {
      setError("Ingresa el código de sala o pega el enlace completo.");
      return;
    }

    let codigoFinal = input;
    // Si pegaron un URL completo como .../juego?sala=SURV-XXXX
    try {
      if (input.includes("sala=")) {
        const url = new URL(input.startsWith("http") ? input : `http://${input}`);
        const param = url.searchParams.get("sala");
        if (param) codigoFinal = param;
      }
    } catch {
      // no es URL válida, usar el texto directo
    }

    codigoFinal = codigoFinal.toUpperCase().replace(/\s+/g, "");
    setAbierto(false);
    router.push(`/juego?sala=${encodeURIComponent(codigoFinal)}`);
  };

  if (!abierto) return null;

  return (
    <div className="modal-backdrop" onClick={() => setAbierto(false)}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setAbierto(false)} aria-label="Cerrar modal">
          ✕
        </button>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="section-tag" style={{ background: "rgba(41, 243, 115, 0.15)", color: "var(--toxic-green)", borderColor: "var(--toxic-green)" }}>
            SISTEMA MULTIJUGADOR COOPERATIVO
          </div>
          <h3 className="blood-title" style={{ fontSize: "1.8rem", color: modo === "crear" ? "var(--toxic-green)" : "#ff3355" }}>
            {modo === "crear" ? "CREAR SALA DE COMBATE" : "UNIRME A UNA SALA"}
          </h3>
          <p className="font-tech" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {modo === "crear"
              ? "Genera una clave de acceso o comparte el enlace para jugar en la misma sala en línea."
              : "Ingresa el código proporcionado por el creador o pega el enlace de invitación."}
          </p>
        </div>

        {/* Switch tabs */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${modo === "crear" ? "active-green" : ""}`}
            onClick={() => {
              setModo("crear");
              setCodigoSala(generarCodigo());
              setError("");
              setCopiado(false);
            }}
          >
            🟢 Crear Sala (Generar Código)
          </button>
          <button
            type="button"
            className={`modal-tab ${modo === "unirme" ? "active-green" : ""}`}
            onClick={() => {
              setModo("unirme");
              setError("");
              setCopiado(false);
            }}
          >
            🟢 Unirme con Código
          </button>
        </div>

        {error && <div className="modal-alert error">{error}</div>}

        {/* MODO CREAR */}
        {modo === "crear" && (
          <div className="room-create-box">
            <div className="font-tech" style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
              CÓDIGO DE TRANSMISIÓN DE SALA:
            </div>

            <div className="room-code-display">{codigoSala}</div>

            <div className="room-url-preview font-tech">
              <span>🔗 Link para compartir:</span>
              <code>{obtenerUrlInvitacion()}</code>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleCopiar}
                className="btn-green-secondary"
                style={{ flex: 1, minWidth: "180px", justifyContent: "center" }}
              >
                <span>{copiado ? "✅" : "📋"}</span>
                {copiado ? "¡ENLACE COPIADO!" : "COPIAR LINK DE SALA"}
              </button>

              <button
                type="button"
                onClick={() => setCodigoSala(generarCodigo())}
                className="btn-tactical-outline"
                style={{ padding: "12px", fontSize: "0.85rem" }}
                title="Generar otro código"
              >
                🔄
              </button>
            </div>

            <button
              type="button"
              onClick={handleEntrarCreada}
              className="btn-green-primary"
              style={{ width: "100%", marginTop: "16px", justifyContent: "center" }}
            >
              <span>⚔️</span> INICIAR PARTIDA EN ESTA SALA ➔
            </button>
          </div>
        )}

        {/* MODO UNIRME */}
        {modo === "unirme" && (
          <form onSubmit={handleUnirse} className="modal-form">
            <div className="form-group">
              <label className="form-label font-tech">CÓDIGO DE SALA O ENLACE COMPLETO:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. SURV-9X82 o https://.../juego?sala=SURV-9X82"
                value={codigoIngresado}
                onChange={(e) => setCodigoIngresado(e.target.value)}
                autoFocus
              />
              <span className="font-tech" style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "6px", display: "block" }}>
                Puedes pegar el código que te pasaron o el link completo de la partida compartida.
              </span>
            </div>

            <button
              type="submit"
              className="btn-green-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>🟢</span> CONECTARME A LA PARTIDA ➔
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
