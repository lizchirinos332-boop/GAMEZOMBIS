import type { Metadata } from "next";
import "./globals.css";
import NavbarClient from "@/components/NavbarClient";
import AuthModal from "@/components/AuthModal";
import PartidaModal from "@/components/PartidaModal";

export const metadata: Metadata = {
  title: "☣️ Zombie Survival | Demo Técnica Next.js App Router",
  description: "Demo H4_T2: Layout compartido, /juego (Phaser SSR-free) y /jugador/[id] dinámico con registro de supervivientes y salas multijugador",
};

// Layout raíz: se comparte entre TODAS las rutas y no se vuelve a montar al navegar (mantiene estado y rendimiento).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="nav-hazard-stripe" />
        <NavbarClient />

        <main className="container">{children}</main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-warning">
              ⚠️ ALERTA BIOLÓGICA ACTIVA · FRECUENCIA DE EMERGENCIA 94.7 FM
            </div>
            <p className="footer-info">
              H4_T2 · Videojuego Web · <strong>Universidad Franz Tamayo (UNIFRANZ)</strong> · Next.js App Router (Layout Compartido · Client Components aislados · Rutas Dinámicas con Suspense)
            </p>
          </div>
        </footer>

        {/* Modales globales interactivos */}
        <AuthModal />
        <PartidaModal />
      </body>
    </html>
  );
}
