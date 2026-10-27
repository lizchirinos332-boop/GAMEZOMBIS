import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="dossier-card" style={{ textAlign: "center", padding: "50px 20px" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>☣️ 💀</div>
      <h1 className="blood-title" style={{ fontSize: "2rem", marginBottom: "14px" }}>
        SUPERVIVIENTE NO ENCONTRADO
      </h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto 24px" }}>
        No existe registro militar o biológico para este ID en la base de datos del refugio.
        Los combatientes registrados son <strong>/jugador/1</strong> (Liz), <strong>/jugador/2</strong> (Mateo) y <strong>/jugador/3</strong> (Camila).
      </p>
      <div style={{ display: "inline-flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn-blood-primary">
          <span>🏚️</span> Volver al Búnker Principal
        </Link>
        <Link href="/juego" className="btn-tactical-outline">
          <span>⚔️</span> Ir a la Zona de Combate
        </Link>
      </div>
    </div>
  );
}
