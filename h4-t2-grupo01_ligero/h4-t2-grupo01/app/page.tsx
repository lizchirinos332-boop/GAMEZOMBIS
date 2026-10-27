import Image from "next/image";
import LobbyActions from "@/components/LobbyActions";
import RankingSupervivientes from "@/components/RankingSupervivientes";

// Server Component (por defecto en App Router): se renderiza en el servidor sin sobrecargar el cliente con JS innecesario.
export default function Inicio() {
  return (
    <>
      {/* ==================== HERO POST-APOCALÍPTICO ==================== */}
      <section className="hero-banner-container">
        <Image
          src="/zombie_banner.jpg"
          alt="Horda de zombis en ciudad devastada bajo alarma roja"
          width={1280}
          height={720}
          priority
          className="hero-bg-image"
        />
        <div className="hero-gradient-overlay">
          <div className="hero-alert-badge">
            <span>☣️ ALERTA BIOLÓGICA MÁXIMA</span>
            <span>·</span>
            <span>AMENAZA NIVEL 5: INFECCIÓN TOTAL</span>
          </div>

          <h1 className="hero-title blood-title">
            OUTBREAK: ZOMBIE SURVIVAL
          </h1>

          <p className="hero-description">
            La metrópoli ha sucumbido a la peste necromórfica. Crea o únete a una sala con código para sobrevivir junto a tus compañeros,
            registra tu superviviente real y compite por el mayor número de zombis aniquilados.
          </p>

          {/* Acciones principales: Jugar solo, Crear Partida (Verde), Unirme a Partida (Verde), Iniciar Sesión */}
          <LobbyActions />
        </div>
      </section>

      {/* ==================== HUD DE ESTADÍSTICAS GLOBALES ==================== */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <span>💀</span> Total Zombis Abatidos
          </div>
          <div className="stat-value stat-value-blood">HORDA SIN FIN</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>🛡️</span> Horda Más Alta
          </div>
          <div className="stat-value stat-value-hazard">OLEADA 5</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>☣️</span> Conexión de Salas
          </div>
          <div className="stat-value stat-value-toxic">ENLACES ACTIVOS</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <span>⚡</span> Motor Gráfico
          </div>
          <div className="stat-value">PHASER 3 + NEXT.JS</div>
        </div>
      </section>

      {/* ==================== BANNER MULTIJUGADOR / SALAS COMPARTIDAS ==================== */}
      <section className="sala-info-banner">
        <div className="sala-info-icon">🌐</div>
        <div style={{ flex: 1 }}>
          <h3 className="font-tech" style={{ color: "var(--toxic-green)", fontSize: "1.2rem", marginBottom: "4px" }}>
            SALAS DE JUEGO COMPARTIDAS CON CÓDIGO Y ENLACE
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: "1.5" }}>
            Al pulsar <strong>&quot;CREAR PARTIDA&quot;</strong> se genera un código único de sala (ej. <code>SURV-8821</code>).
            Puedes copiar el enlace directo de invitación para enviárselo a tus amigos en cualquier plataforma o ingresarlo con <strong>&quot;UNIRME A PARTIDA&quot;</strong>.
          </p>
        </div>
      </section>

      {/* ==================== DOSSIERS / RANKING DE SUPERVIVIENTES REALES ==================== */}
      <section id="supervivientes" className="section-wrapper">
        <div className="section-header">
          <div>
            <span className="section-tag">BASE DE DATOS MILITAR EN VIVO</span>
            <h2 className="horror-heading" style={{ marginTop: "6px" }}>
              Supervivientes Registrados
            </h2>
          </div>
          <p className="font-tech" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Expedientes reales sincronizados. Cada perfil enlaza a la ruta dinámica <code>/jugador/[id]</code>.
          </p>
        </div>

        {/* Componente reactivo con jugadores reales */}
        <RankingSupervivientes />
      </section>

      {/* ==================== ARSENAL Y TÁCTICAS DE COMBATE ==================== */}
      <section className="section-wrapper">
        <div className="section-header">
          <div>
            <span className="section-tag">ARMERÍA DEL BÚNKER</span>
            <h2 className="horror-heading" style={{ marginTop: "6px" }}>
              Arsenal de Exterminio
            </h2>
          </div>
          <span className="font-tech" style={{ color: "var(--hazard-yellow)", fontSize: "0.85rem" }}>
            Cajas de suministros aparecen en los sectores marcados
          </span>
        </div>

        <div className="weapons-grid">
          <div className="weapon-card">
            <div className="weapon-icon-box">🔫</div>
            <h4>
              Pistola Táctica 9mm
              <span className="weapon-key-badge">TECLA 1</span>
            </h4>
            <p className="weapon-desc">
              Arma reglamentaria inicial. Cadencia media con munición ilimitada. Ideal para contener zombis aislados sin desperdiciar recursos.
            </p>
          </div>

          <div className="weapon-card">
            <div className="weapon-icon-box">💥</div>
            <h4>
              Escopeta de Combate 12G
              <span className="weapon-key-badge">TECLA 2 · OLEADA 2</span>
            </h4>
            <p className="weapon-desc">
              Dispara ráfagas de 6 perdigones devastadores a corta distancia. Se desbloquea al recoger el cofre de armas en la oleada 2.
            </p>
          </div>

          <div className="weapon-card">
            <div className="weapon-icon-box">⚡</div>
            <h4>
              Rifle Automático M4
              <span className="weapon-key-badge">TECLA 3 · OLEADA 3</span>
            </h4>
            <p className="weapon-desc">
              Cadencia ultrasónica y doble daño por proyectil. Diseñado para abatir tanques y hordas masivas. Requiere recoger el cofre en el nivel 3.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== TERMINAL TÉCNICA NEXT.JS (H4_T2) ==================== */}
      <section className="tech-terminal">
        <div className="tech-terminal-header">
          <div className="tech-dots">
            <span className="tech-dot red" />
            <span className="tech-dot yellow" />
            <span className="tech-dot green" />
          </div>
          <span className="tech-terminal-title">
            TERMINAL DE CONTROL DE ARQUITECTURA TÉCNICA · NEXT.JS APP ROUTER
          </span>
        </div>

        <div className="tech-terminal-body">
          <p className="font-tech" style={{ color: "var(--toxic-green)", marginBottom: "16px", fontSize: "0.88rem" }}>
            &gt; INFORME TÉCNICO GRUPO 01: DEMOSTRACIÓN DE LOS 4 REQUERIMIENTOS CLAVE DEL PROYECTO
          </p>

          <div className="tech-grid">
            <div className="tech-feature-card">
              <h5>
                <span>🧱</span> 1. Layout Compartido
              </h5>
              <p>
                El archivo <code>app/layout.tsx</code> actúa como caparazón maestro. Mantiene la barra de estado y los controles vivos sin remonte ni parpadeos entre transiciones de ruta.
              </p>
            </div>

            <div className="tech-feature-card">
              <h5>
                <span>🎮</span> 2. Ruta de Juego <code>/juego</code>
              </h5>
              <p>
                El motor Phaser 3 requiere el objeto global <code>window</code>. Se importa de forma segura en el cliente usando <code>next/dynamic(..., &#123; ssr: false &#125;)</code> en un Client Component.
              </p>
            </div>

            <div className="tech-feature-card">
              <h5>
                <span>🧬</span> 3. Ruta Dinámica <code>/jugador/[id]</code>
              </h5>
              <p>
                Server Component con enrutamiento dinámico. En Next.js moderno los <code>params</code> se leen asíncronamente con <code>Promise</code> y se protegen con <code>&lt;Suspense&gt;</code>.
              </p>
            </div>

            <div className="tech-feature-card">
              <h5>
                <span>🚀</span> 4. Navegación con <code>&lt;Link&gt;</code>
              </h5>
              <p>
                Enrutamiento del lado del cliente optimizado con prefetching automático al posar el cursor, asegurando latencia cero y preservando el estado de la aplicación.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
