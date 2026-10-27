// Motor de audio procedural para Zombie Survival mediante Web Audio API.
// Genera efectos de sonido hiperrealistas y atmosféricos en tiempo real:
// gemidos guturales de zombis, gritos de muerte, gritos de dolor del jugador,
// disparos tácticos (pistola, escopeta, rifle), impactos sangrientos, alertas y latidos.

class MotorSonidos {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private silenciado = false;
  private volumen = 0.8;
  private inicializado = false;

  // Buffers de ruido precalculados para rendimiento y texturas orgánicas
  private bufferRuidoBlanco: AudioBuffer | null = null;
  private bufferRuidoRosa: AudioBuffer | null = null;
  private bufferRuidoMarron: AudioBuffer | null = null;

  // Control de latidos cardíacos (salud baja)
  private intervaloLatido: ReturnType<typeof setInterval> | null = null;
  private ultimoLatidoMs = 0;

  // Límite de concurrencia para evitar saturación de audio
  private sonidosActivos = 0;
  private readonly MAX_SONIDOS = 24;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const guardado = localStorage.getItem("zombie_survival_audio");
        if (guardado) {
          const cfg = JSON.parse(guardado);
          if (typeof cfg.silenciado === "boolean") this.silenciado = cfg.silenciado;
          if (typeof cfg.volumen === "number") this.volumen = Math.max(0, Math.min(1, cfg.volumen));
        }
      } catch {
        // Fallback a valores por defecto
      }
    }
  }

  // Inicializar o reanudar el AudioContext tras un gesto del usuario
  public async iniciar(): Promise<void> {
    if (typeof window === "undefined") return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.silenciado ? 0 : this.volumen, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.generarBuffersRuido();
      this.inicializado = true;
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume().catch(() => {});
    }
  }

  private generarBuffersRuido(): void {
    if (!this.ctx) return;
    const duracion = 2; // 2 segundos en loop
    const sr = this.ctx.sampleRate;
    const tamano = sr * duracion;

    // Ruido Blanco
    this.bufferRuidoBlanco = this.ctx.createBuffer(1, tamano, sr);
    const dataBlanco = this.bufferRuidoBlanco.getChannelData(0);
    for (let i = 0; i < tamano; i++) {
      dataBlanco[i] = Math.random() * 2 - 1;
    }

    // Ruido Rosa (filtro de Paul Kellet)
    this.bufferRuidoRosa = this.ctx.createBuffer(1, tamano, sr);
    const dataRosa = this.bufferRuidoRosa.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < tamano; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      dataRosa[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    // Ruido Marrón (integración para rugidos guturales y bajos cavernosos)
    this.bufferRuidoMarron = this.ctx.createBuffer(1, tamano, sr);
    const dataMarron = this.bufferRuidoMarron.getChannelData(0);
    let ultimoMarron = 0;
    for (let i = 0; i < tamano; i++) {
      const white = Math.random() * 2 - 1;
      ultimoMarron = (ultimoMarron + (0.025 * white)) / 1.02;
      dataMarron[i] = ultimoMarron * 3.2;
    }
  }

  // Crear nodo de paneo espacial 2D (izquierda / derecha según posición X en pantalla)
  private crearPanner(x?: number, anchoMundo?: number): AudioNode {
    if (!this.ctx) throw new Error("AudioContext no listo");
    if (typeof this.ctx.createStereoPanner === "function" && x !== undefined && anchoMundo !== undefined && anchoMundo > 0) {
      const panner = this.ctx.createStereoPanner();
      const pan = Math.max(-0.95, Math.min(0.95, ((x / anchoMundo) - 0.5) * 2));
      panner.pan.value = pan;
      return panner;
    }
    return this.ctx.createGain();
  }

  // Curva de distorsión para garganta de zombi y saturación de disparos
  private crearCurvaDistorsion(cantidad = 20): Float32Array {
    const k = cantidad;
    const n = 512;
    const curva = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curva[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curva;
  }

  // Guardar configuración en localStorage
  private guardar(): void {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "zombie_survival_audio",
          JSON.stringify({ silenciado: this.silenciado, volumen: this.volumen })
        );
      } catch {
        // ignore
      }
    }
  }

  // ==================== CONTROLES DE USUARIO ====================
  public estaSilenciado(): boolean {
    return this.silenciado;
  }

  public alternarSilencio(): boolean {
    this.silenciado = !this.silenciado;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.silenciado ? 0 : this.volumen, this.ctx.currentTime);
    }
    if (this.silenciado) this.detenerLatido();
    this.guardar();
    return this.silenciado;
  }

  public setVolumen(v: number): void {
    this.volumen = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx && !this.silenciado) {
      this.masterGain.gain.setValueAtTime(this.volumen, this.ctx.currentTime);
    }
    this.guardar();
  }

  public obtenerVolumen(): number {
    return this.volumen;
  }

  // ==============================================================
  // 1. SONIDOS DE ZOMBIS (GEMIDOS, RUGIDOS Y GRITOS)
  // ==============================================================

  /**
   * Gemido gutural de zombi acechando (normal, rapido o tanque)
   * Usa síntesis de formantes vocales con osciladores desafinados y ruido marrón de garganta.
   */
  public zombieGemido(tipo: "normal" | "rapido" | "tanque" = "normal", x?: number, anchoMundo = 960): void {
    if (this.silenciado || this.sonidosActivos >= this.MAX_SONIDOS) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    this.sonidosActivos++;
    const t0 = this.ctx.currentTime;
    const panner = this.crearPanner(x, anchoMundo);
    const salida = this.ctx.createGain();
    salida.connect(panner);
    panner.connect(this.masterGain);

    if (tipo === "rapido") {
      // ZOMBI RÁPIDO: Chillido agudo, frenético y rasposo ("¡Sssscreeech!")
      const dur = 0.55 + Math.random() * 0.2;
      salida.gain.setValueAtTime(0.01, t0);
      salida.gain.linearRampToValueAtTime(0.35, t0 + 0.08);
      salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      const f0 = 420 + Math.random() * 80;
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.5, t0 + 0.18);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.7, t0 + dur);

      // Tremolo rápido (vibrato histérico)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(14 + Math.random() * 4, t0);
      lfoGain.gain.setValueAtTime(40, t0);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur);

      // Filtro formante agudo
      const filtro = this.ctx.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.frequency.setValueAtTime(1400, t0);
      filtro.Q.setValueAtTime(3.5, t0);

      osc.connect(filtro);
      filtro.connect(salida);
      osc.start(t0);
      osc.stop(t0 + dur);

      // Ruido de chillido rasposo
      if (this.bufferRuidoRosa) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.bufferRuidoRosa;
        const noiseFiltro = this.ctx.createBiquadFilter();
        noiseFiltro.type = "highpass";
        noiseFiltro.frequency.setValueAtTime(1800, t0);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, t0);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        noise.connect(noiseFiltro);
        noiseFiltro.connect(noiseGain);
        noiseGain.connect(salida);
        noise.start(t0);
        noise.stop(t0 + dur);
      }

      setTimeout(() => { this.sonidosActivos--; }, dur * 1000 + 50);

    } else if (tipo === "tanque") {
      // ZOMBI TANQUE: Rugido colosal, estruendo cavernoso y sub-graves devastadores ("BRROOAAAGGHH")
      const dur = 1.3 + Math.random() * 0.3;
      salida.gain.setValueAtTime(0.01, t0);
      salida.gain.linearRampToValueAtTime(0.55, t0 + 0.15);
      salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      // Sub-bajo y oscilador diente de sierra desafinado
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sawtooth";
      osc2.type = "triangle";

      const f0 = 55 + Math.random() * 8;
      osc1.frequency.setValueAtTime(f0, t0);
      osc1.frequency.exponentialRampToValueAtTime(f0 * 0.65, t0 + dur);
      osc2.frequency.setValueAtTime(f0 * 0.5, t0);
      osc2.frequency.exponentialRampToValueAtTime(f0 * 0.4, t0 + dur);

      // Distorsión rugosa
      const dist = this.ctx.createWaveShaper();
      dist.curve = this.crearCurvaDistorsion(35) as Float32Array<ArrayBuffer>;
      dist.oversample = "2x";

      // Filtro formante bajo cavernoso
      const filtro = this.ctx.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.setValueAtTime(260, t0);
      filtro.Q.setValueAtTime(4.0, t0);

      osc1.connect(dist);
      osc2.connect(dist);
      dist.connect(filtro);
      filtro.connect(salida);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t0 + dur);
      osc2.stop(t0 + dur);

      // Resoplido y rugido marrón
      if (this.bufferRuidoMarron) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.bufferRuidoMarron;
        const nFiltro = this.ctx.createBiquadFilter();
        nFiltro.type = "bandpass";
        nFiltro.frequency.setValueAtTime(180, t0);
        nFiltro.Q.setValueAtTime(2.5, t0);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.25, t0);
        nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        noise.connect(nFiltro);
        nFiltro.connect(nGain);
        nGain.connect(salida);
        noise.start(t0);
        noise.stop(t0 + dur);
      }

      setTimeout(() => { this.sonidosActivos--; }, dur * 1000 + 50);

    } else {
      // ZOMBI NORMAL: Gemido gutural clásico descompuesto ("Uuuurrrgghhh... Rrrggggh")
      const dur = 0.85 + Math.random() * 0.35;
      salida.gain.setValueAtTime(0.01, t0);
      salida.gain.linearRampToValueAtTime(0.38, t0 + 0.12);
      salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      const f0 = 92 + (Math.random() * 24 - 12);
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.linearRampToValueAtTime(f0 * 1.15, t0 + dur * 0.35);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.75, t0 + dur);

      // LFO para temblor de cuerdas vocales descompuestas
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.8 + Math.random() * 1.5, t0);
      lfoGain.gain.setValueAtTime(9, t0);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur);

      // Filtro formante vocal (barrido de "Ur" a "Gh")
      const filtro = this.ctx.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.frequency.setValueAtTime(620, t0);
      filtro.frequency.exponentialRampToValueAtTime(320, t0 + dur);
      filtro.Q.setValueAtTime(3.2, t0);

      // Ligera saturación orgánica
      const dist = this.ctx.createWaveShaper();
      dist.curve = this.crearCurvaDistorsion(18) as Float32Array<ArrayBuffer>;

      osc.connect(dist);
      dist.connect(filtro);
      filtro.connect(salida);
      osc.start(t0);
      osc.stop(t0 + dur);

      // Aliento podrido (ruido rosa filtrado)
      if (this.bufferRuidoRosa) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.bufferRuidoRosa;
        const nFiltro = this.ctx.createBiquadFilter();
        nFiltro.type = "bandpass";
        nFiltro.frequency.setValueAtTime(500, t0);
        nFiltro.Q.setValueAtTime(2.0, t0);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.14, t0);
        nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        noise.connect(nFiltro);
        nFiltro.connect(nGain);
        nGain.connect(salida);
        noise.start(t0);
        noise.stop(t0 + dur);
      }

      setTimeout(() => { this.sonidosActivos--; }, dur * 1000 + 50);
    }
  }

  /**
   * Grito agónico de muerte del zombi al ser eliminado por una bala
   */
  public zombieMuerte(tipo: "normal" | "rapido" | "tanque" = "normal", x?: number, anchoMundo = 960): void {
    if (this.silenciado || this.sonidosActivos >= this.MAX_SONIDOS) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    this.sonidosActivos++;
    const t0 = this.ctx.currentTime;
    const panner = this.crearPanner(x, anchoMundo);
    const salida = this.ctx.createGain();
    salida.connect(panner);
    panner.connect(this.masterGain);

    const dur = tipo === "tanque" ? 0.75 : 0.42;
    salida.gain.setValueAtTime(0.42, t0);
    salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    // Grito desgarrador descendente
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    const freqInicial = tipo === "rapido" ? 720 : tipo === "tanque" ? 160 : 340;
    osc.frequency.setValueAtTime(freqInicial, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + dur);

    const filtro = this.ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(tipo === "rapido" ? 2200 : 900, t0);
    filtro.frequency.exponentialRampToValueAtTime(150, t0 + dur);

    const dist = this.ctx.createWaveShaper();
    dist.curve = this.crearCurvaDistorsion(25) as Float32Array<ArrayBuffer>;

    osc.connect(dist);
    dist.connect(filtro);
    filtro.connect(salida);
    osc.start(t0);
    osc.stop(t0 + dur);

    // Exhalación de muerte violenta (ruido)
    if (this.bufferRuidoBlanco) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.bufferRuidoBlanco;
      const nFiltro = this.ctx.createBiquadFilter();
      nFiltro.type = "bandpass";
      nFiltro.frequency.setValueAtTime(1100, t0);
      nFiltro.Q.setValueAtTime(2, t0);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.28, t0);
      nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur * 0.8);

      noise.connect(nFiltro);
      nFiltro.connect(nGain);
      nGain.connect(salida);
      noise.start(t0);
      noise.stop(t0 + dur);
    }

    setTimeout(() => { this.sonidosActivos--; }, dur * 1000 + 40);
  }

  /**
   * Ataque físico del zombi (mordisco / zarpazo con desgarro)
   */
  public zombieAtaque(): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    const dur = 0.22;
    salida.gain.setValueAtTime(0.45, t0);
    salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    // Chasquido de mandíbulas y golpe sordo
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(160, t0);
    osc.frequency.exponentialRampToValueAtTime(35, t0 + dur);

    osc.connect(salida);
    osc.start(t0);
    osc.stop(t0 + dur);

    // Ruido de desgarro
    if (this.bufferRuidoBlanco) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.bufferRuidoBlanco;
      const nFiltro = this.ctx.createBiquadFilter();
      nFiltro.type = "bandpass";
      nFiltro.frequency.setValueAtTime(800, t0);
      nFiltro.Q.setValueAtTime(1.5, t0);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35, t0);
      nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      noise.connect(nFiltro);
      nFiltro.connect(nGain);
      nGain.connect(salida);
      noise.start(t0);
      noise.stop(t0 + dur);
    }
  }

  /**
   * Grito de dolor del jugador herido ("¡Arrrgh!" / jadeo de agonía)
   */
  public jugadorDanio(): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    const dur = 0.28;
    salida.gain.setValueAtTime(0.01, t0);
    salida.gain.linearRampToValueAtTime(0.5, t0 + 0.02);
    salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    // Tono vocal humano en dolor: comienza en 240Hz y cae a 110Hz
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(250 + Math.random() * 20, t0);
    osc.frequency.exponentialRampToValueAtTime(110, t0 + dur);

    // Formante vocal ("¡Aaargh!")
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.setValueAtTime(950, t0);
    filtro.Q.setValueAtTime(2.2, t0);

    osc.connect(filtro);
    filtro.connect(salida);
    osc.start(t0);
    osc.stop(t0 + dur);

    // Jadeo de asfixia/impacto
    if (this.bufferRuidoRosa) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.bufferRuidoRosa;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.2, t0);
      nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      noise.connect(nGain);
      nGain.connect(salida);
      noise.start(t0);
      noise.stop(t0 + dur);
    }
  }

  // ==============================================================
  // 2. DISPAROS Y COMBATE TÁCTICO
  // ==============================================================

  /**
   * Disparo de arma (pistola, escopeta o rifle)
   */
  public disparo(arma: "pistola" | "escopeta" | "rifle"): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    if (arma === "pistola") {
      // PISTOLA: Chasquido seco y punzante de 9mm
      const dur = 0.12;
      salida.gain.setValueAtTime(0.38, t0);
      salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, t0);
      osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.045);

      osc.connect(salida);
      osc.start(t0);
      osc.stop(t0 + dur);

      if (this.bufferRuidoBlanco) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.bufferRuidoBlanco;
        const nFiltro = this.ctx.createBiquadFilter();
        nFiltro.type = "highpass";
        nFiltro.frequency.setValueAtTime(1200, t0);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.45, t0);
        nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        noise.connect(nFiltro);
        nFiltro.connect(nGain);
        nGain.connect(salida);
        noise.start(t0);
        noise.stop(t0 + dur);
      }

    } else if (arma === "escopeta") {
      // ESCOPETA: Detonación pesada, ensordecedora y con sub-grave explosivo
      const dur = 0.36;
      salida.gain.setValueAtTime(0.65, t0);
      salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      const sub = this.ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(160, t0);
      sub.frequency.exponentialRampToValueAtTime(28, t0 + 0.18);

      const dist = this.ctx.createWaveShaper();
      dist.curve = this.crearCurvaDistorsion(25) as Float32Array<ArrayBuffer>;

      sub.connect(dist);
      dist.connect(salida);
      sub.start(t0);
      sub.stop(t0 + dur);

      if (this.bufferRuidoRosa) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.bufferRuidoRosa;
        const nFiltro = this.ctx.createBiquadFilter();
        nFiltro.type = "lowpass";
        nFiltro.frequency.setValueAtTime(2800, t0);
        nFiltro.frequency.exponentialRampToValueAtTime(400, t0 + dur);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.6, t0);
        nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        noise.connect(nFiltro);
        nFiltro.connect(nGain);
        nGain.connect(salida);
        noise.start(t0);
        noise.stop(t0 + dur);
      }

    } else {
      // RIFLE: Ráfaga penetrante de asalto militar, metálica y veloz
      const dur = 0.14;
      salida.gain.setValueAtTime(0.42, t0);
      salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(580, t0);
      osc.frequency.exponentialRampToValueAtTime(75, t0 + 0.05);

      const filtro = this.ctx.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.frequency.setValueAtTime(1600, t0);
      filtro.Q.setValueAtTime(2.5, t0);

      osc.connect(filtro);
      filtro.connect(salida);
      osc.start(t0);
      osc.stop(t0 + dur);

      if (this.bufferRuidoBlanco) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.bufferRuidoBlanco;
        const nFiltro = this.ctx.createBiquadFilter();
        nFiltro.type = "highpass";
        nFiltro.frequency.setValueAtTime(2400, t0);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.35, t0);
        nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        noise.connect(nFiltro);
        nFiltro.connect(nGain);
        nGain.connect(salida);
        noise.start(t0);
        noise.stop(t0 + dur);
      }
    }
  }

  /**
   * Impacto de bala en carne zombi (sangre y desgarro húmedo)
   */
  public impactoBala(x?: number, anchoMundo = 960): void {
    if (this.silenciado || this.sonidosActivos >= this.MAX_SONIDOS) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    this.sonidosActivos++;
    const t0 = this.ctx.currentTime;
    const panner = this.crearPanner(x, anchoMundo);
    const salida = this.ctx.createGain();
    salida.connect(panner);
    panner.connect(this.masterGain);

    const dur = 0.07;
    salida.gain.setValueAtTime(0.32, t0);
    salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    // Golpe sordo de carne ("splat")
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(280, t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + dur);

    osc.connect(salida);
    osc.start(t0);
    osc.stop(t0 + dur);

    if (this.bufferRuidoRosa) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.bufferRuidoRosa;
      const nFiltro = this.ctx.createBiquadFilter();
      nFiltro.type = "lowpass";
      nFiltro.frequency.setValueAtTime(1100, t0);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.25, t0);
      nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

      noise.connect(nFiltro);
      nFiltro.connect(nGain);
      nGain.connect(salida);
      noise.start(t0);
      noise.stop(t0 + dur);
    }

    setTimeout(() => { this.sonidosActivos--; }, dur * 1000 + 30);
  }

  // ==============================================================
  // 3. RECOLECCIÓN Y ARSENAL
  // ==============================================================

  /**
   * Botiquín recogido: sonido de curación táctica (inyección y campana de alivio)
   */
  public recogerSalud(): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    salida.gain.setValueAtTime(0.3, t0);
    salida.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);

    // Dos tonos armónicos ascendentes
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(523.25, t0); // C5
    osc1.frequency.setValueAtTime(659.25, t0 + 0.1); // E5
    osc2.frequency.setValueAtTime(783.99, t0 + 0.1); // G5

    osc1.connect(salida);
    osc2.connect(salida);
    osc1.start(t0);
    osc2.start(t0 + 0.1);
    osc1.stop(t0 + 0.35);
    osc2.stop(t0 + 0.35);
  }

  /**
   * Munición recogida: sonido metálico de carga de cartuchos
   */
  public recogerMunicion(): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    // Doble clic metálico
    [0, 0.07].forEach((delay) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, t0 + delay);
      osc.frequency.exponentialRampToValueAtTime(300, t0 + delay + 0.04);

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.3, t0 + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.05);

      osc.connect(g);
      g.connect(salida);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + 0.05);
    });
  }

  /**
   * Desbloqueo / recogida de arma pesada (escopeta / rifle)
   */
  public desbloquearArma(): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    // Corredera pesada ("¡CHCK-CLACK!")
    [0, 0.09].forEach((delay, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(idx === 0 ? 300 : 500, t0 + delay);
      osc.frequency.exponentialRampToValueAtTime(80, t0 + delay + 0.08);

      const filtro = this.ctx!.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.frequency.setValueAtTime(800, t0 + delay);

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.35, t0 + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.09);

      osc.connect(filtro);
      filtro.connect(g);
      g.connect(salida);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + 0.09);
    });
  }

  /**
   * Cambio de arma (teclas 1, 2, 3)
   */
  public cambiarArma(): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    const dur = 0.05;
    salida.gain.setValueAtTime(0.2, t0);
    salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(950, t0);
    osc.frequency.exponentialRampToValueAtTime(250, t0 + dur);

    osc.connect(salida);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  // ==============================================================
  // 4. ATMÓSFERA, ALERTAS Y TENSION
  // ==============================================================

  /**
   * Alerta de nueva oleada: Sirena militar apocalíptica
   */
  public alertaOleada(numeroOleada = 1): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    // Dos pulsos de alarma
    [0, 0.45].forEach((delay) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, t0 + delay);
      osc.frequency.linearRampToValueAtTime(280 + numeroOleada * 15, t0 + delay + 0.3);

      const filtro = this.ctx!.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.setValueAtTime(750, t0 + delay);

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.01, t0 + delay);
      g.gain.linearRampToValueAtTime(0.35, t0 + delay + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.38);

      osc.connect(filtro);
      filtro.connect(g);
      g.connect(salida);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + 0.38);
    });
  }

  /**
   * Oleada superada: Fanfarria de victoria táctica
   */
  public nivelCompletado(): void {
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    const notas = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notas.forEach((freq, idx) => {
      const delay = idx * 0.12;
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0 + delay);

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.28, t0 + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.4);

      osc.connect(g);
      g.connect(salida);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + 0.4);
    });
  }

  /**
   * Latido cardíaco en tiempo real cuando la vida es crítica (< 35%)
   */
  public actualizarLatido(vidaActual: number): void {
    if (this.silenciado || vidaActual <= 0 || vidaActual > 35) {
      this.detenerLatido();
      return;
    }

    // Intervalo de latidos según gravedad: de 850ms a 420ms
    const cadencia = 420 + (vidaActual / 35) * 430;
    const ahora = Date.now();

    if (ahora - this.ultimoLatidoMs >= cadencia) {
      this.ultimoLatidoMs = ahora;
      this.reproducirPulsacionCardiaca();
    }
  }

  private reproducirPulsacionCardiaca(): void {
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    // "LUB-DUB": dos contracciones ventriculares profundas
    [
      { delay: 0, freq: 58, gain: 0.35, dur: 0.08 },
      { delay: 0.11, freq: 48, gain: 0.28, dur: 0.09 },
    ].forEach(({ delay, freq, gain, dur }) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0 + delay);
      osc.frequency.exponentialRampToValueAtTime(32, t0 + delay + dur);

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(gain, t0 + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + dur);

      osc.connect(g);
      g.connect(salida);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + dur);
    });
  }

  public detenerLatido(): void {
    if (this.intervaloLatido) {
      clearInterval(this.intervaloLatido);
      this.intervaloLatido = null;
    }
  }

  /**
   * Fin de partida / Muerte del superviviente: Estruendo fúnebre y grito siniestro
   */
  public gameOver(): void {
    this.detenerLatido();
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    const dur = 1.8;
    salida.gain.setValueAtTime(0.48, t0);
    salida.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    // Acorde menor disonante descendente hacia el abismo
    const frecuencias = [146.83, 174.61, 220.0, 293.66]; // D3, F3, A3, D4
    frecuencias.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, t0);
      osc.frequency.exponentialRampToValueAtTime(f * 0.45, t0 + dur);

      const filtro = this.ctx!.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.setValueAtTime(600, t0);
      filtro.frequency.exponentialRampToValueAtTime(80, t0 + dur);

      osc.connect(filtro);
      filtro.connect(salida);
      osc.start(t0);
      osc.stop(t0 + dur);
    });

    // Viento sepulcral
    if (this.bufferRuidoMarron) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.bufferRuidoMarron;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.3, t0);
      nGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      noise.connect(nGain);
      nGain.connect(salida);
      noise.start(t0);
      noise.stop(t0 + dur);
    }
  }

  /**
   * Victoria: ¡Sobreviviste a todas las oleadas de exterminio!
   */
  public victoria(): void {
    this.detenerLatido();
    if (this.silenciado) return;
    this.iniciar();
    if (!this.ctx || !this.masterGain) return;

    const t0 = this.ctx.currentTime;
    const salida = this.ctx.createGain();
    salida.connect(this.masterGain);

    const notas = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]; // C arpeggio
    notas.forEach((freq, i) => {
      const delay = i * 0.13;
      const osc = this.ctx!.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t0 + delay);

      const g = this.ctx!.createGain();
      g.gain.setValueAtTime(0.3, t0 + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.6);

      osc.connect(g);
      g.connect(salida);
      osc.start(t0 + delay);
      osc.stop(t0 + delay + 0.6);
    });
  }

  public limpiar(): void {
    this.detenerLatido();
  }
}

// Instancia única exportada para toda la aplicación
export const sonidos = new MotorSonidos();
