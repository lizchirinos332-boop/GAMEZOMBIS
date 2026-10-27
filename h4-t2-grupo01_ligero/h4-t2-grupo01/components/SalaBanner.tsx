"use client";
import { useState } from "react";

export default function SalaBanner({ sala }: { sala: string }) {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = async () => {
    try {
      const url = `${window.location.origin}/juego?sala=${encodeURIComponent(sala)}`;
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="sala-banner-box">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "1.4rem" }}>🟢</span>
        <div>
          <div className="font-tech" style={{ color: "#29f373", fontWeight: "bold", letterSpacing: "1px" }}>
            SALA ACTIVA: #{sala}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Comparte este código o enlace con tus compañeros para que se unan a esta partida.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopiar}
        className="btn-green-secondary"
        style={{ padding: "8px 16px", fontSize: "0.85rem", marginLeft: "auto" }}
      >
        <span>{copiado ? "✅" : "📋"}</span>
        <span>{copiado ? "¡ENLACE COPIADO!" : "COPIAR ENLACE DE SALA"}</span>
      </button>
    </div>
  );
}
