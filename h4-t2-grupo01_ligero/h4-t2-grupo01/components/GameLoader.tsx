"use client";
// En el App Router, `ssr: false` solo se permite dentro de un Client Component.
// Por eso este archivo existe: es el "puente" entre la página (servidor) y Phaser (navegador).
import dynamic from "next/dynamic";

const Game = dynamic(() => import("./Game"), {
  ssr: false,
  loading: () => (
    <div className="gamebox" style={{ color: "var(--toxic-green)", fontFamily: "'Share Tech Mono', monospace" }}>
      ⚡ INICIALIZANDO MOTOR PHASER 3 Y CARGANDO ARSENAL...
    </div>
  ),
});

export default function GameLoader({ sala }: { sala?: string }) {
  return <Game sala={sala} />;
}
