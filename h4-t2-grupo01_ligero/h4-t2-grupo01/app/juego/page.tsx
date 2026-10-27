import { Suspense } from "react";
import GameLoader from "@/components/GameLoader";
import SalaBanner from "@/components/SalaBanner";
import Link from "next/link";

export const metadata = {
  title: "☣️ Zona de Combate (/juego) | Zombie Survival",
  description: "Shooter táctico 2D en Phaser 3 cargado dinámicamente en el cliente mediante Next.js dynamic import (ssr: false).",
};

async function JuegoConSala({
  searchParams,
}: {
  searchParams: Promise<{ sala?: string }>;
}) {
  const { sala } = await searchParams;
  return (
    <>
      {sala && <SalaBanner sala={sala} />}
      <GameLoader sala={sala} />
    </>
  );
}

export default function JuegoPage({
  searchParams,
}: {
  searchParams: Promise<{ sala?: string }>;
}) {
  return (
    <div style={{ padding: "10px 0 20px" }}>
      <div className="section-header" style={{ marginBottom: "12px", paddingBottom: "8px" }}>
        <div>
          <span className="section-tag">ZONA DE GUERRA ACTIVA · SECTOR 01</span>
          <h1 className="blood-title" style={{ fontSize: "2.2rem", marginTop: "4px" }}>
            ZOMBIE SURVIVAL: EXTERMINIO
          </h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href="/" className="btn-tactical-outline" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            <span>🏚️</span> Búnker (Inicio)
          </Link>
        </div>
      </div>

      {/* Controles rápidos */}
      <div
        style={{
          background: "rgba(14, 16, 22, 0.9)",
          border: "1px solid rgba(255, 183, 3, 0.25)",
          borderRadius: "8px",
          padding: "10px 16px",
          marginBottom: "12px",
          display: "flex",
          gap: "20px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span className="font-tech" style={{ fontSize: "0.85rem", color: "#fff" }}>
          🎮 <strong>WASD / Flechas</strong>: Movimiento
        </span>
        <span className="font-tech" style={{ fontSize: "0.85rem", color: "#fff" }}>
          🎯 <strong>Mouse</strong>: Apuntar / Disparar
        </span>
        <span className="font-tech" style={{ fontSize: "0.85rem", color: "var(--hazard-yellow)" }}>
          🔫 <strong>1, 2, 3</strong>: Cambiar armas
        </span>
        <span className="font-tech" style={{ fontSize: "0.85rem", color: "var(--blood-bright)" }}>
          🔊 <strong>Sonido 2D</strong>: Zombis, gritos, armas y latidos
        </span>
        <span className="font-tech" style={{ fontSize: "0.85rem", color: "var(--toxic-green)", marginLeft: "auto" }}>
          💡 Usa <strong>🎙️ PROBAR SONIDOS</strong> en el HUD para calibrar el volumen
        </span>
      </div>

      <Suspense
        fallback={
          <div className="gamebox" style={{ color: "var(--toxic-green)", fontFamily: "'Share Tech Mono', monospace" }}>
            ⚡ INICIALIZANDO ZONA DE COMBATE...
          </div>
        }
      >
        <JuegoConSala searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
