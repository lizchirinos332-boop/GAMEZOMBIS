"use client";
import { useEffect, useRef, useState } from "react";
import { obtenerJugadorActivo, registrarResultadoPartida } from "@/lib/jugadores";
import { sonidos } from "@/lib/sonidos";
import SoundboardModal from "./SoundboardModal";

interface GameProps {
  sala?: string;
}

// Juego de zombis (vista superior) con Phaser 3 e integración completa de audio procedural.
export default function Game({ sala }: GameProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [esFullscreen, setEsFullscreen] = useState(false);
  const [silenciado, setSilenciado] = useState(false);
  const [mostrarSoundboard, setMostrarSoundboard] = useState(false);

  useEffect(() => {
    setSilenciado(sonidos.estaSilenciado());

    const onFullscreenChange = () => {
      setEsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    let juego: import("phaser").Game | undefined;
    let cancelado = false;

    (async () => {
      const Phaser = (await import("phaser")).default;
      if (cancelado || !contenedor.current) return;

      const jugadorActivo = obtenerJugadorActivo();
      const nombreJugador = jugadorActivo ? jugadorActivo.nombre : "";

      const W = 960, H = 540;
      type ArmaId = "pistola" | "escopeta" | "rifle";
      const ARMAS: Record<ArmaId, { nombre: string; cd: number; dano: number; perdigones: number; dispersion: number; vel: number; tecla: string }> = {
        pistola:  { nombre: "Pistola",  cd: 340, dano: 1, perdigones: 1, dispersion: 0.03, vel: 650, tecla: "1" },
        escopeta: { nombre: "Escopeta", cd: 800, dano: 1, perdigones: 6, dispersion: 0.28, vel: 560, tecla: "2" },
        rifle:    { nombre: "Rifle",    cd: 120, dano: 2, perdigones: 1, dispersion: 0.05, vel: 820, tecla: "3" },
      };
      const NIVELES = [
        { total: 8,  vel: 55, delay: 1300, rapidos: 0,    tanques: 0 },
        { total: 12, vel: 62, delay: 1100, rapidos: 0.2,  tanques: 0 },
        { total: 16, vel: 70, delay: 950,  rapidos: 0.25, tanques: 0.1 },
        { total: 20, vel: 78, delay: 800,  rapidos: 0.3,  tanques: 0.15 },
        { total: 26, vel: 85, delay: 650,  rapidos: 0.3,  tanques: 0.2 },
      ];
      const POS_CAJAS = [{ x: 150, y: 120 }, { x: 810, y: 120 }, { x: 150, y: 420 }, { x: 810, y: 420 }, { x: 480, y: 90 }, { x: 480, y: 450 }];

      class Escena extends Phaser.Scene {
        jugador!: Phaser.Physics.Arcade.Sprite;
        zombis!: Phaser.Physics.Arcade.Group;
        balas!: Phaser.Physics.Arcade.Group;
        cajas!: Phaser.Physics.Arcade.Group;
        cursores!: Phaser.Types.Input.Keyboard.CursorKeys;
        wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
        teclasExtra!: { one: Phaser.Input.Keyboard.Key; two: Phaser.Input.Keyboard.Key; three: Phaser.Input.Keyboard.Key; r: Phaser.Input.Keyboard.Key };
        textoHud!: Phaser.GameObjects.Text;
        textoSala!: Phaser.GameObjects.Text;
        textoArmas!: Phaser.GameObjects.Text;
        aviso!: Phaser.GameObjects.Text;
        barra!: Phaser.GameObjects.Graphics;
        estado: "intro" | "jugando" | "fin" | "victoria" = "intro";
        nivel = 0; vida = 100; puntos = 0; matados = 0; aparecidos = 0;
        arma: ArmaId = "pistola";
        desbloqueadas: Record<ArmaId, boolean> = { pistola: true, escopeta: false, rifle: false };
        municion: Record<ArmaId, number> = { pistola: -1, escopeta: 0, rifle: 0 };
        proximoDisparo = 0; proximoGolpe = 0;
        proximoGemido = 0;
        temporizador?: Phaser.Time.TimerEvent;

        init() {
          this.estado = "intro"; this.nivel = 0; this.vida = 100; this.puntos = 0; this.matados = 0; this.aparecidos = 0;
          this.arma = "pistola";
          this.desbloqueadas = { pistola: true, escopeta: false, rifle: false };
          this.municion = { pistola: -1, escopeta: 0, rifle: 0 };
          this.proximoGemido = 0;
          sonidos.detenerLatido();
        }

        texturas() {
          const g = this.add.graphics();
          const hacer = (k: string, w: number, h: number, f: () => void) => { g.clear(); f(); g.generateTexture(k, w, h); };

          hacer("suelo", 64, 64, () => {
            g.fillStyle(0x1a1e16, 1).fillRect(0, 0, 64, 64);
            for (let i = 0; i < 40; i++) {
              g.fillStyle(Phaser.Math.RND.pick([0x141810, 0x22281d, 0x1d2319]), 1);
              g.fillRect(Phaser.Math.Between(0, 60), Phaser.Math.Between(0, 60), Phaser.Math.Between(2, 6), Phaser.Math.Between(2, 6));
            }
            g.fillStyle(0x4a0f0f, 0.4).fillCircle(20, 40, 4);
          });

          const jugadorBase = (largoArma: number, color: number, culata: boolean) => {
            if (culata) g.fillStyle(0x5a3a1e, 1).fillRect(26, 22, 10, 6);
            g.fillStyle(color, 1).fillRect(32, 22, largoArma, 5);
            g.fillStyle(0xf1c27d, 1).fillCircle(36, 20, 4).fillCircle(36 + Math.min(largoArma - 6, 16), 28, 4);
            g.fillStyle(0x1f5c3a, 1).fillCircle(24, 24, 14);
            g.fillStyle(0x143c26, 1).fillCircle(24, 24, 10);
            g.fillStyle(0xf1c27d, 1).fillCircle(24, 24, 7);
            g.fillStyle(0x2d1d11, 1).fillCircle(22, 24, 6);
          };
          hacer("j_pistola", 72, 48, () => jugadorBase(14, 0x777777, false));
          hacer("j_escopeta", 72, 48, () => jugadorBase(34, 0x4a4a4a, true));
          hacer("j_rifle", 72, 48, () => jugadorBase(36, 0x2d2d2d, true));

          hacer("zombi", 48, 48, () => {
            g.fillStyle(0x4f7d3a, 1).fillRect(24, 12, 20, 7).fillRect(24, 29, 20, 7);
            g.fillStyle(0x8fb36a, 1).fillCircle(44, 15, 4).fillCircle(44, 32, 4);
            g.fillStyle(0x3c5f2d, 1).fillCircle(22, 24, 14);
            g.fillStyle(0x6f9b54, 1).fillCircle(24, 24, 9);
            g.fillStyle(0xd62828, 1).fillCircle(29, 20, 2).fillCircle(29, 28, 2);
          });
          hacer("bala", 12, 4, () => { g.fillStyle(0xffd166, 1).fillRect(0, 0, 12, 4); });
          hacer("sangre", 8, 8, () => { g.fillStyle(0x9d0208, 1).fillCircle(4, 4, 4); });

          const caja = (k: string, color: number, dibujo: () => void) => hacer(k, 36, 36, () => {
            g.fillStyle(0x000000, 0.35).fillRect(3, 5, 32, 32);
            g.fillStyle(color, 1).fillRect(2, 2, 32, 32);
            g.lineStyle(2, 0xffffff, 0.9).strokeRect(2, 2, 32, 32);
            dibujo();
          });
          caja("c_salud", 0x9d0208, () => { g.fillStyle(0xffffff, 1).fillRect(15, 8, 6, 20).fillRect(8, 15, 20, 6); });
          caja("c_municion", 0x7f5539, () => { g.fillStyle(0xffd166, 1).fillRect(8, 10, 5, 16).fillRect(16, 10, 5, 16).fillRect(24, 10, 5, 16); });
          caja("c_escopeta", 0x1b4332, () => { g.fillStyle(0xdddddd, 1).fillRect(5, 15, 26, 4).fillRect(5, 21, 26, 4); });
          caja("c_rifle", 0x0b3954, () => { g.fillStyle(0xdddddd, 1).fillRect(4, 16, 28, 4).fillRect(4, 20, 8, 7); });
          g.destroy();
        }

        create() {
          this.texturas();
          this.physics.world.setBounds(0, 0, W, H);
          this.add.tileSprite(0, 0, W, H, "suelo").setOrigin(0);
          this.input.setDefaultCursor("crosshair");

          this.jugador = this.physics.add.sprite(W / 2, H / 2, "j_pistola");
          this.jugador.setOrigin(24 / 72, 0.5).setCollideWorldBounds(true).setDepth(10);
          this.jugador.body!.setCircle(14, 10, 10);

          this.zombis = this.physics.add.group();
          this.balas = this.physics.add.group();
          this.cajas = this.physics.add.group();

          // 1. Cursores nativos de Phaser (Flechas + Espacio) con captura automática de scroll
          this.cursores = this.input.keyboard!.createCursorKeys();

          // 2. Teclas WASD configuradas explícitamente
          this.wasd = this.input.keyboard!.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
          }) as { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };

          // 3. Teclas de cambio de arma y reinicio
          this.teclasExtra = this.input.keyboard!.addKeys({
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            r: Phaser.Input.Keyboard.KeyCodes.R,
          }) as { one: Phaser.Input.Keyboard.Key; two: Phaser.Input.Keyboard.Key; three: Phaser.Input.Keyboard.Key; r: Phaser.Input.Keyboard.Key };

          // 4. Capturar teclas en Phaser para que consuma el scroll del navegador internamente
          this.input.keyboard!.addCapture(["UP", "DOWN", "LEFT", "RIGHT", "SPACE", "W", "A", "S", "D"]);

          this.physics.add.overlap(this.balas, this.zombis, (b, z) => this.balaMataZombi(b as Phaser.Physics.Arcade.Sprite, z as Phaser.Physics.Arcade.Sprite));
          this.physics.add.overlap(this.jugador, this.zombis, (_j, z) => this.zombiGolpea(z as Phaser.Physics.Arcade.Sprite));
          this.physics.add.overlap(this.jugador, this.cajas, (_j, c) => this.recoger(c as Phaser.Physics.Arcade.Sprite));

          // HUD
          this.barra = this.add.graphics().setDepth(100);
          this.textoHud = this.add.text(16, 36, "", { fontSize: "16px", color: "#ffffff", stroke: "#000", strokeThickness: 4, fontFamily: "'Share Tech Mono', monospace" }).setDepth(100);

          const etiquetaSala = sala ? `SALA: #${sala}` : "MODO LOCAL";
          const etiquetaJugador = nombreJugador ? `PILOTO: ${nombreJugador}` : "";
          this.textoSala = this.add.text(W - 16, 16, `${etiquetaJugador}  [${etiquetaSala}]`, {
            fontSize: "15px",
            color: "#29f373",
            stroke: "#000",
            strokeThickness: 4,
            fontFamily: "'Share Tech Mono', monospace",
          }).setOrigin(1, 0).setDepth(100);

          this.textoArmas = this.add.text(W / 2, H - 14, "", { fontSize: "16px", color: "#ffffff", stroke: "#000", strokeThickness: 4, fontFamily: "'Share Tech Mono', monospace" }).setOrigin(0.5, 1).setDepth(100);
          this.aviso = this.add.text(W / 2, H / 2 - 20, "", { fontSize: "42px", fontStyle: "bold", color: "#ffd166", align: "center", stroke: "#000", strokeThickness: 7, fontFamily: "'Black Ops One', sans-serif" }).setOrigin(0.5).setDepth(200);

          // Inicializar audio al interactuar con el lienzo
          this.input.on("pointerdown", () => {
            sonidos.iniciar();
            if (this.estado === "fin" || this.estado === "victoria") this.scene.restart();
          });
          this.input.keyboard?.on("keydown", () => {
            sonidos.iniciar();
          });

          this.time.addEvent({ delay: 12000, loop: true, callback: () => this.cajaAleatoria() });
          this.empezarNivel(0);
        }

        empezarNivel(n: number) {
          this.nivel = n; this.matados = 0; this.aparecidos = 0; this.estado = "intro";
          this.zombis.clear(true, true);
          this.temporizador?.remove();
          this.aviso.setText(`OLEADA ${n + 1}\n${NIVELES[n].total} zombis detectados`);
          sonidos.alertaOleada(n + 1);

          if (n >= 1 && !this.desbloqueadas.escopeta) this.crearCaja("escopeta", POS_CAJAS[0]);
          if (n >= 2 && !this.desbloqueadas.rifle) this.crearCaja("rifle", POS_CAJAS[1]);
          this.time.delayedCall(1800, () => {
            this.aviso.setText("");
            this.estado = "jugando";
            this.temporizador = this.time.addEvent({ delay: NIVELES[n].delay, loop: true, callback: () => this.aparecer() });
          });
        }

        aparecer() {
          const cfg = NIVELES[this.nivel];
          if (this.estado !== "jugando" || this.aparecidos >= cfg.total) return;
          const lado = Phaser.Math.Between(0, 3);
          const x = lado === 0 ? -20 : lado === 1 ? W + 20 : Phaser.Math.Between(0, W);
          const y = lado === 2 ? -20 : lado === 3 ? H + 20 : Phaser.Math.Between(0, H);
          const z = this.zombis.create(x, y, "zombi") as Phaser.Physics.Arcade.Sprite;
          z.setOrigin(22 / 48, 0.5).setDepth(5);
          z.body!.setCircle(14, 8, 10);
          const r = Math.random();
          let tipo = "normal", vida = 2, vel = cfg.vel, escala = 1;
          if (r < cfg.tanques) { tipo = "tanque"; vida = 6; vel = cfg.vel * 0.6; escala = 1.4; z.setTint(0x88aaff); }
          else if (r < cfg.tanques + cfg.rapidos) { tipo = "rapido"; vida = 1; vel = cfg.vel * 1.8; z.setTint(0xffb366); }
          z.setScale(escala).setData({ vida, vel, tipo });
          this.aparecidos++;

          // Rugido / gemido espacializado al irrumpir en la arena
          sonidos.zombieGemido(tipo as "normal" | "rapido" | "tanque", z.x, W);
        }

        disparar(ahora: number) {
          const a = ARMAS[this.arma];
          if (ahora < this.proximoDisparo) return;
          this.proximoDisparo = ahora + a.cd;
          if (this.municion[this.arma] === 0) return;
          if (this.municion[this.arma] > 0) this.municion[this.arma]--;

          // Disparo de arma según el calibre actual
          sonidos.disparo(this.arma);

          const p = this.input.activePointer;
          const ang = Phaser.Math.Angle.Between(this.jugador.x, this.jugador.y, p.worldX, p.worldY);
          const largo = this.arma === "pistola" ? 44 : 66;
          for (let i = 0; i < a.perdigones; i++) {
            const d = ang + Phaser.Math.FloatBetween(-a.dispersion, a.dispersion);
            const b = this.balas.create(this.jugador.x + Math.cos(ang) * largo, this.jugador.y + Math.sin(ang) * largo, "bala") as Phaser.Physics.Arcade.Sprite;
            b.setRotation(d).setDepth(8).setData("dano", a.dano);
            b.body!.setSize(10, 6);
            this.physics.velocityFromRotation(d, a.vel, b.body!.velocity);
          }
          const f = this.add.circle(this.jugador.x + Math.cos(ang) * (largo + 6), this.jugador.y + Math.sin(ang) * (largo + 6), 9, 0xffe29a, 0.9).setDepth(9);
          this.tweens.add({ targets: f, alpha: 0, scale: 0.4, duration: 90, onComplete: () => f.destroy() });
          if (this.municion[this.arma] === 0) this.cambiarArma("pistola");
        }

        balaMataZombi(b: Phaser.Physics.Arcade.Sprite, z: Phaser.Physics.Arcade.Sprite) {
          if (!b.active || !z.active) return;
          const dano = b.getData("dano") as number;
          const tipoZombi = (z.getData("tipo") as "normal" | "rapido" | "tanque") || "normal";
          const xZombi = z.x;
          b.destroy();

          const vida = (z.getData("vida") as number) - dano;
          z.setData("vida", vida);
          this.salpicar(z.x, z.y, 3);
          sonidos.impactoBala(xZombi, W);

          if (vida > 0) {
            z.setAlpha(0.45);
            this.time.delayedCall(60, () => { if (z.active) z.setAlpha(1); });
            return;
          }

          // Zombi aniquilado: grito de muerte agónico
          this.salpicar(z.x, z.y, 10);
          this.puntos += z.getData("tipo") === "tanque" ? 30 : z.getData("tipo") === "rapido" ? 15 : 10;
          this.matados++;
          sonidos.zombieMuerte(tipoZombi, xZombi, W);

          if (Math.random() < 0.1) this.crearCaja("salud", { x: z.x, y: z.y });
          z.destroy();
        }

        zombiGolpea(z: Phaser.Physics.Arcade.Sprite) {
          if (this.estado !== "jugando" || this.time.now < this.proximoGolpe) return;
          this.proximoGolpe = this.time.now + 600;
          this.vida -= z.getData("tipo") === "tanque" ? 20 : 10;
          this.cameras.main.shake(100, 0.005);
          this.jugador.setTint(0xff6666);
          this.time.delayedCall(120, () => this.jugador.clearTint());

          // Mordisco violento del zombi y grito de dolor del superviviente
          sonidos.zombieAtaque();
          sonidos.jugadorDanio();

          if (this.vida <= 0) this.terminar(false);
        }

        salpicar(x: number, y: number, n: number) {
          for (let i = 0; i < n; i++) {
            const s = this.add.image(x, y, "sangre").setDepth(3).setScale(Phaser.Math.FloatBetween(0.4, 1));
            this.tweens.add({
              targets: s, x: x + Phaser.Math.Between(-30, 30), y: y + Phaser.Math.Between(-30, 30), alpha: 0, duration: 700,
              onComplete: () => s.destroy(),
            });
          }
        }

        crearCaja(tipo: "escopeta" | "rifle" | "municion" | "salud", pos: { x: number; y: number }) {
          const c = this.cajas.create(pos.x, pos.y, `c_${tipo}`) as Phaser.Physics.Arcade.Sprite;
          c.setDepth(4).setData("tipo", tipo);
          const etiqueta = { escopeta: "ESCOPETA", rifle: "RIFLE", municion: "MUNICIÓN", salud: "SALUD" }[tipo];
          const t = this.add.text(pos.x, pos.y - 28, etiqueta, { fontSize: "12px", color: "#ffffff", stroke: "#000", strokeThickness: 3 }).setOrigin(0.5).setDepth(4);
          c.setData("etiqueta", t);
          this.tweens.add({ targets: c, scale: 1.12, yoyo: true, repeat: -1, duration: 600 });
        }

        cajaAleatoria() {
          if (this.estado !== "jugando" || this.cajas.countActive() >= 3) return;
          const pos = Phaser.Math.RND.pick(POS_CAJAS);
          this.crearCaja(Math.random() < 0.5 ? "municion" : "salud", pos);
        }

        recoger(c: Phaser.Physics.Arcade.Sprite) {
          const tipo = c.getData("tipo") as string;
          if (tipo === "salud") {
            this.vida = Math.min(100, this.vida + 30);
            sonidos.recogerSalud();
          } else if (tipo === "municion") {
            if (this.desbloqueadas.escopeta) this.municion.escopeta += 10;
            if (this.desbloqueadas.rifle) this.municion.rifle += 40;
            if (!this.desbloqueadas.escopeta && !this.desbloqueadas.rifle) this.vida = Math.min(100, this.vida + 10);
            sonidos.recogerMunicion();
          } else {
            const id = tipo as ArmaId;
            this.desbloqueadas[id] = true;
            this.municion[id] += id === "escopeta" ? 24 : 90;
            this.cambiarArma(id);
            sonidos.desbloquearArma();
          }
          (c.getData("etiqueta") as Phaser.GameObjects.Text).destroy();
          c.destroy();
        }

        cambiarArma(id: ArmaId) {
          if (!this.desbloqueadas[id] || (id !== "pistola" && this.municion[id] === 0)) return;
          if (this.arma !== id) {
            sonidos.cambiarArma();
          }
          this.arma = id;
          this.jugador.setTexture(`j_${id}`);
        }

        terminar(victoria: boolean) {
          this.estado = victoria ? "victoria" : "fin";
          this.temporizador?.remove();
          this.zombis.setVelocity(0, 0);

          sonidos.detenerLatido();
          if (victoria) {
            sonidos.victoria();
          } else {
            sonidos.gameOver();
          }

          // Guardar resultado para el jugador activo real
          registrarResultadoPartida(this.puntos, this.nivel + 1, this.matados);

          this.aviso.setText(
            victoria
              ? `¡SOBREVIVISTE!\nPuntaje: ${this.puntos}\nClic para jugar otra vez`
              : `GAME OVER\nPuntaje: ${this.puntos}\nClic o R para reintentar`
          );
          this.aviso.setColor(victoria ? "#80ed99" : "#ff6b6b");
        }

        update(ahora: number) {
          const c = this.cursores;
          const w = this.wasd;
          const e = this.teclasExtra;

          // Reiniciar con tecla R
          if (e.r.isDown && (this.estado === "fin" || this.estado === "victoria")) {
            this.scene.restart();
            return;
          }

          // HUD
          this.barra.clear();
          this.barra.fillStyle(0x000000, 0.6).fillRect(14, 10, 204, 20);
          this.barra.fillStyle(this.vida > 35 ? 0x2dc653 : 0xd62828, 1).fillRect(16, 12, Math.max(0, this.vida) * 2, 16);
          const cfg = NIVELES[this.nivel];
          this.textoHud.setText(`Nivel ${this.nivel + 1}/${NIVELES.length}   Zombis ${this.matados}/${cfg.total}   Puntos ${this.puntos}`);
          this.textoArmas.setText((Object.keys(ARMAS) as ArmaId[]).map((id) => {
            const a = ARMAS[id];
            const m = !this.desbloqueadas[id] ? "bloqueada" : this.municion[id] < 0 ? "∞" : String(this.municion[id]);
            return `${id === this.arma ? "▶" : " "}[${a.tecla}] ${a.nombre}: ${m}`;
          }).join("     "));

          if (this.estado === "fin" || this.estado === "victoria") {
            sonidos.detenerLatido();
            return;
          }

          // Control de latido cardíaco agónico cuando la salud está en estado crítico (< 35%)
          if (this.estado === "jugando") {
            sonidos.actualizarLatido(this.vida);

            // Gemidos ambientales periódicos de la horda de zombis acechando
            if (ahora > this.proximoGemido) {
              this.proximoGemido = ahora + Phaser.Math.Between(2600, 5200);
              const zombisVivos = this.zombis.getChildren();
              if (zombisVivos.length > 0) {
                const zRnd = Phaser.Math.RND.pick(zombisVivos) as Phaser.Physics.Arcade.Sprite;
                if (zRnd && zRnd.active) {
                  const t = (zRnd.getData("tipo") as "normal" | "rapido" | "tanque") || "normal";
                  sonidos.zombieGemido(t, zRnd.x, W);
                }
              }
            }
          } else {
            sonidos.detenerLatido();
          }

          // Durante la introducción de nivel no hay movimiento
          if (this.estado === "intro") {
            this.jugador.setVelocity(0, 0);
            return;
          }

          // ---------- MOVIMIENTO SÓLIDO (WASD Y FLECHAS) ----------
          const izquierda = Boolean(c.left?.isDown || w.left?.isDown);
          const derecha = Boolean(c.right?.isDown || w.right?.isDown);
          const arriba = Boolean(c.up?.isDown || w.up?.isDown);
          const abajo = Boolean(c.down?.isDown || w.down?.isDown);

          let vx = 0;
          let vy = 0;

          if (derecha) vx += 1;
          if (izquierda) vx -= 1;
          if (abajo) vy += 1;
          if (arriba) vy -= 1;

          // Aplicar velocidad al jugador
          const VELOCIDAD = 210;
          this.jugador.setVelocity(vx * VELOCIDAD, vy * VELOCIDAD);

          // Normalizar velocidad diagonal
          if (vx !== 0 && vy !== 0) {
            this.jugador.body!.velocity.scale(0.7071);
          }

          // Rotación hacia el puntero del mouse
          const p = this.input.activePointer;
          this.jugador.setRotation(Phaser.Math.Angle.Between(this.jugador.x, this.jugador.y, p.worldX, p.worldY));

          // Cambio de armas con 1, 2, 3
          if (Phaser.Input.Keyboard.JustDown(e.one)) this.cambiarArma("pistola");
          if (Phaser.Input.Keyboard.JustDown(e.two)) this.cambiarArma("escopeta");
          if (Phaser.Input.Keyboard.JustDown(e.three)) this.cambiarArma("rifle");

          // Disparo con clic
          if (this.estado === "jugando" && p.isDown) this.disparar(ahora);

          // Zombis persiguen al jugador
          this.zombis.getChildren().forEach((o) => {
            const z = o as Phaser.Physics.Arcade.Sprite;
            const ang = Phaser.Math.Angle.Between(z.x, z.y, this.jugador.x, this.jugador.y);
            z.setRotation(ang);
            if (this.estado === "jugando") this.physics.velocityFromRotation(ang, z.getData("vel") as number, z.body!.velocity);
          });

          // Balas fuera de pantalla
          this.balas.getChildren().forEach((o) => {
            const b = o as Phaser.Physics.Arcade.Sprite;
            if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.destroy();
          });

          // Nivel completado
          if (this.estado === "jugando" && this.matados >= cfg.total) {
            this.temporizador?.remove();
            if (this.nivel === NIVELES.length - 1) { this.terminar(true); return; }
            this.estado = "intro";
            this.vida = Math.min(100, this.vida + 25);
            this.aviso.setText(`¡NIVEL ${this.nivel + 1} COMPLETADO!`);
            sonidos.nivelCompletado();
            this.time.delayedCall(2200, () => this.empezarNivel(this.nivel + 1));
          }
        }
      }

      juego = new Phaser.Game({
        type: Phaser.AUTO,
        width: W,
        height: H,
        parent: contenedor.current,
        backgroundColor: "#141712",
        physics: { default: "arcade", arcade: { debug: false } },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: Escena,
      });
    })();

    return () => {
      cancelado = true;
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      sonidos.limpiar();
      juego?.destroy(true);
    };
  }, [sala]);

  const alternarMute = () => {
    const nuevo = sonidos.alternarSilencio();
    setSilenciado(nuevo);
  };

  const alternarFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`game-wrapper-container ${esFullscreen ? "is-fullscreen" : ""}`}
    >
      <div className="game-hud-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span className="beacon-dot" />
          <span className="font-tech" style={{ color: "#29f373", fontSize: "0.85rem" }}>
            {sala ? `🟢 SALA: #${sala}` : "🟢 ARENA DE SUPERVIVENCIA"}
          </span>
          <span
            className="font-tech"
            style={{
              fontSize: "0.72rem",
              background: "rgba(41, 243, 115, 0.12)",
              border: "1px solid rgba(41, 243, 115, 0.35)",
              color: "var(--toxic-green)",
              padding: "2px 8px",
              borderRadius: "4px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>🎧</span>
            <span>SONIDO 2D ACTIVO</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={alternarMute}
            className={`btn-audio-hud ${silenciado ? "is-muted" : ""}`}
            title={silenciado ? "Activar audio (zombis, disparos, gritos)" : "Silenciar audio"}
          >
            <span>{silenciado ? "🔇" : "🔊"}</span>
            <span>{silenciado ? "MUTED" : "SONIDO: ON"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sonidos.iniciar();
              setMostrarSoundboard(true);
            }}
            className="btn-audio-hud"
            title="Abrir consola de pruebas de efectos de sonido"
          >
            <span>🎙️</span>
            <span>PROBAR SONIDOS</span>
          </button>

          <button
            type="button"
            onClick={alternarFullscreen}
            className="btn-fullscreen-toggle font-tech"
            title={esFullscreen ? "Salir de pantalla completa (ESC)" : "Jugar en pantalla completa"}
          >
            <span>{esFullscreen ? "🗗" : "⛶"}</span>
            <span>{esFullscreen ? "SALIR PANTALLA COMPLETA" : "PANTALLA COMPLETA"}</span>
          </button>
        </div>
      </div>

      <div ref={contenedor} className="gamebox" tabIndex={0} />

      <SoundboardModal
        abierto={mostrarSoundboard}
        alCerrar={() => setMostrarSoundboard(false)}
      />
    </div>
  );
}
