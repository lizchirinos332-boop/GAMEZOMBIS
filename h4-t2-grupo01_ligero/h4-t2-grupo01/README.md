# ☣️ H4_T2 – Zombie Survival (Mini-demo Next.js · Grupo 01)

Mini-demo técnica desarrollada con **Next.js (App Router)** para el informe comparativo y avance del proyecto de videojuego web.

Cuenta con ambientación completa de **supervivencia zombi**, sistema de **jugadores reales** con inicio de sesión y registro, generación de **salas multijugador con código y enlaces compartibles**, y corrección total de estabilidad de pantalla y pantalla completa.

---

## 🚀 Nuevas Funcionalidades Implementadas

### 1. Sistema de Inicio de Sesión y Registro de Jugadores Reales
- **Modal interactivo** accesible desde la navegación y la página de inicio.
- Se eliminaron por completo los jugadores de prueba (Liz, Mateo, Camila).
- Los jugadores pueden registrar su **alias real**, elegir su **rol táctico** (Asalto, Francotirador, Médico, Explorador) y su **avatar/insignia**.
- Se almacenan de forma persistente en `localStorage` y se sincronizan a través de la API `app/api/jugadores/route.ts`.
- Las bajas de zombis, oleadas y puntajes obtenidos en `/juego` se guardan automáticamente en el perfil del jugador activo.
- Cada jugador registrado tiene su propia ruta dinámica en **`/jugador/[id]`**.

### 2. Botones Verdes: "CREAR PARTIDA" y "UNIRME A PARTIDA"
- **🟢 CREAR PARTIDA**:
  - Genera automáticamente un código único de sala táctica (ejemplo: `SURV-8821`).
  - Proporciona un botón para **copiar el enlace directo** (ej. `http://.../juego?sala=SURV-8821`) para compartirlo con amigos en redes, WhatsApp o Discord.
  - Botón para iniciar inmediatamente la partida dentro de dicha sala.
- **🟢 UNIRME A PARTIDA**:
  - Permite pegar el código de sala o el link completo compartido para conectarse a la partida.
- **Banner de Sala Activa**:
  - Dentro de `/juego`, se muestra la sala en la que se está jugando (`🟢 SALA ACTIVA: #SURV-8821`), permitiendo volver a copiar el enlace en cualquier momento.

### 3. Corrección de Desplazamiento y Modo Pantalla Completa
- **Bloqueo de Scroll Involuntario**: Se implementó prevención de eventos por defecto (`preventDefault()`) y captura de teclado en Phaser para teclas WASD, flechas y barra espaciadora. La pantalla **ya no se baja ni se sube** al maniobrar al personaje.
- **Botón "⛶ PANTALLA COMPLETA"**: Permite expandir el juego al 100% del monitor sin márgenes ni distracciones, manteniendo la relación de aspecto 16:9 y eliminando cualquier movimiento o salto del layout.

---

## 🎮 Demostración de Requerimientos Académicos

1. **Layout Compartido (`app/layout.tsx`)**:
   - Barra biohazard y pie de página compartidos entre todas las rutas, sin desmontaje ni recargas.
2. **Ruta Inicio (`app/page.tsx`)**:
   - Server Component con banner cinemático, tipografía sangrienta (`Nosifer` y `Creepster`), métricas y ranking de supervivientes reales conectados.
3. **Ruta de Juego (`/juego` · `app/juego/page.tsx`)**:
   - Shooter 2D con **Phaser 3**, cargado exclusivamente en el cliente mediante `next/dynamic(..., { ssr: false })` en `components/GameLoader.tsx`.
4. **Ruta Dinámica (`/jugador/[id]` · `app/jugador/[id]/page.tsx`)**:
   - Server Component con resolución asíncrona de `params` envuelto en `<Suspense>` para soporte total de Cache Components y Partial Prerendering (PPR).
5. **Navegación con `<Link>`**:
   - Transiciones instantáneas del lado del cliente.

---

## 🕹️ Controles del Juego

- **WASD / Flechas**: Moverse por la zona de cuarentena (sin mover la ventana del navegador).
- **Mouse**: Apuntar hacia las hordas.
- **Clic Izquierdo**: Disparo continuo.
- **Teclas 1, 2, 3**: Cambiar de arma (Pistola, Escopeta en oleada 2, Rifle en oleada 3).
- **Botón ⛶**: Alternar Pantalla Completa (o presionar ESC para salir).
- **R o Clic**: Reiniciar tras victoria o derrota.

---

## 📦 Despliegue en GitHub / Vercel

El proyecto está preparado para desplegarse fácilmente:
1. Sube el repositorio a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Zombie Survival con salas multijugador y registro real"
   git remote add origin <TU_REPOSITORIO_GITHUB>
   git push -u origin main
   ```
2. Para desplegar en línea con enlace público para tus compañeros:
   - Importa el repositorio en [Vercel](https://vercel.com).
   - Vercel detectará automáticamente Next.js y generará una URL pública (ejemplo: `https://zombie-survival-grupo01.vercel.app`).
   - Al estar desplegado, cualquier persona que use **"CREAR PARTIDA"** generará un enlace funcional para compartir con sus amigos.

---

## ⚙️ Instalación y Ejecución Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Compilación de Producción

```bash
npm run build
npm start
```
Compilación validada: **0 errores con Turbopack**.

---

## 👥 Integrantes del Grupo 01

- **Coordinador(a) del Informe**: _(Nombre y Apellido)_
- **Integrante 2**: _(Nombre y Apellido)_
- **Integrante 3**: _(Nombre y Apellido)_
