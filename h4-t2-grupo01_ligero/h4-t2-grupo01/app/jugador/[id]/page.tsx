import { Suspense } from "react";
import JugadorDetalleClient from "@/components/JugadorDetalleClient";

// Server Component dinámico: `params` es una Promesa en Next.js 15/16.
// Se lee dentro de un subcomponente envuelto en <Suspense> para permitir prerenderizado parcial (PPR).
async function DetalleWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JugadorDetalleClient id={id} />;
}

export default function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div style={{ padding: "20px 0" }}>
      <Suspense
        fallback={
          <div className="stat-card" style={{ padding: "30px", textAlign: "center" }}>
            <p className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "1.1rem" }}>
              ⏳ Desencriptando expediente clasificado de la base de datos...
            </p>
          </div>
        }
      >
        <DetalleWrapper params={params} />
      </Suspense>
    </div>
  );
}
