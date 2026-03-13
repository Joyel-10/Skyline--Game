export class AudioEngine {
  ctx: AudioContext | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineMaster: GainNode | null = null;

  private introAudio: HTMLAudioElement | null = null;
  private intro2Audio: HTMLAudioElement | null = null;

  // ✅ FIX 2: once intro1 has been stopped (race started), never play it again
  private _introFinished = false;

  private _screeching = false;

  boot() {
    if (this.ctx) return;
    this.ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  }

  /* ─────────────────────────────────────────────
     INTRO MUSIC 1  →  plays when game opens
  ───────────────────────────────────────────── */
  playIntroMusic() {
    // ✅ FIX 2: if race already started, never replay Intro1
    if (this._introFinished) return;
    if (this.introAudio) return; // already playing

    this.introAudio = new Audio("/Intro.mp3");
    this.introAudio.loop = true;
    this.introAudio.volume = 0;

    // ✅ FIX 1: if autoplay is blocked, retry automatically on next interaction
    this.introAudio.play().catch(() => {
      console.log("Autoplay blocked — will retry on first interaction");
      const retry = () => {
        if (this.introAudio && !this._introFinished) {
          this.introAudio.play().catch(() => {});
        }
        window.removeEventListener("click", retry);
        window.removeEventListener("keydown", retry);
      };
      window.addEventListener("click", retry, { once: true });
      window.addEventListener("keydown", retry, { once: true });
    });

    // Fade in to 0.35
    let vol = 0;
    const fade = setInterval(() => {
      if (!this.introAudio) { clearInterval(fade); return; }
      vol = Math.min(vol + 0.02, 0.35);
      this.introAudio.volume = vol;
      if (vol >= 0.35) clearInterval(fade);
    }, 200);

    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  stopIntroMusic() {
    if (!this.introAudio) return;
    this.introAudio.pause();
    this.introAudio.currentTime = 0;
    this.introAudio = null;
    // ✅ FIX 2: mark as finished so playIntroMusic() can never fire again
    this._introFinished = true;
  }

  /* ─────────────────────────────────────────────
     INTRO MUSIC 2  →  plays after lap 1 cinematic
  ───────────────────────────────────────────── */
  playIntroMusic2() {
    if (this.intro2Audio) return;

    this.pauseEngine();

    this.intro2Audio = new Audio("/Intro2.mp3");
    this.intro2Audio.loop = false;
    this.intro2Audio.volume = 0;

    this.intro2Audio.play().catch(() => {
      console.log("Autoplay blocked for Intro2");
    });

    // Fade in to 0.5
    let vol = 0;
    const fade = setInterval(() => {
      if (!this.intro2Audio) { clearInterval(fade); return; }
      vol = Math.min(vol + 0.025, 0.5);
      this.intro2Audio.volume = vol;
      if (vol >= 0.5) clearInterval(fade);
    }, 150);
  }

  stopIntroMusic2() {
    if (!this.intro2Audio) return;

    const audio = this.intro2Audio;
    this.intro2Audio = null;

    let vol = audio.volume;
    const fade = setInterval(() => {
      vol = Math.max(vol - 0.03, 0);
      audio.volume = vol;
      if (vol <= 0) {
        audio.pause();
        audio.currentTime = 0;
        clearInterval(fade);
        this.resumeEngine();
      }
    }, 80);
  }

  /* ─────────────────────────────────────────────
     ENGINE
  ───────────────────────────────────────────── */
  startEngine() {
    if (this.engineOsc) return;

    this.boot();
    const ctx = this.ctx!;

    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = "sawtooth";
    o2.type = "square";
    o1.frequency.value = 55;
    o2.frequency.value = 58;

    const nb = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = nb;
    noise.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.04;
    noise.connect(ng);

    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] =
        ((3 + 25) * x * 20 * (Math.PI / 180)) /
        (Math.PI + 25 * Math.abs(x));
    }
    dist.curve = curve;

    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 380;
    filt.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    const master = ctx.createGain();
    master.gain.value = 0.28;

    o1.connect(dist); o2.connect(dist); dist.connect(filt);
    filt.connect(gain); ng.connect(gain);
    gain.connect(master); master.connect(ctx.destination);

    o1.start(); o2.start(); noise.start();
    gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.5);

    this.engineOsc    = o1;
    this.engineOsc2   = o2;
    this.engineGain   = gain;
    this.engineFilter = filt;
    this.engineMaster = master;
  }

  pauseEngine() {
    if (!this.engineMaster || !this.ctx) return;
    this.engineMaster.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  resumeEngine() {
    if (!this.engineMaster || !this.ctx) return;
    this.engineMaster.gain.setTargetAtTime(0.28, this.ctx.currentTime, 0.4);
  }

  updateEngine(speedKmh: number, nitro: boolean) {
    if (!this.engineOsc || !this.ctx) return;

    const rpm = 50 + speedKmh * 0.95 + (nitro ? 90 : 0);
    const now = this.ctx.currentTime;

    this.engineOsc.frequency.setTargetAtTime(rpm, now, 0.06);
    this.engineOsc2!.frequency.setTargetAtTime(rpm * 1.06, now, 0.06);
    this.engineFilter!.frequency.setTargetAtTime(280 + speedKmh * 2.2, now, 0.09);
    this.engineMaster!.gain.setTargetAtTime(nitro ? 0.42 : 0.28, now, 0.1);
  }

  stopEngine() {
    if (!this.engineOsc) return;

    try {
      this.engineGain!.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.4);
    } catch (_) {}

    setTimeout(() => {
      try { this.engineOsc!.stop(); this.engineOsc2!.stop(); } catch (_) {}
    }, 500);

    this.engineOsc = null;
  }

  /* ─────────────────────────────────────────────
     COLLISION
  ───────────────────────────────────────────── */
  playCollision(intensity = 1) {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
    const d = buf.getChannelData(0);

    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.4);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = Math.min(intensity * 0.8, 1);
    src.connect(g); g.connect(ctx.destination); src.start();
  }

  /* ─────────────────────────────────────────────
     NITRO
  ───────────────────────────────────────────── */
  playNitro() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
    o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.35);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.4);
  }

  /* ─────────────────────────────────────────────
     TIRE SCREECH
  ───────────────────────────────────────────── */
  playTireScreech() {
    if (!this.ctx || this._screeching) return;
    this._screeching = true;

    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 320;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.43);

    setTimeout(() => { this._screeching = false; }, 520);
  }

  /* ─────────────────────────────────────────────
     COUNTDOWN
  ───────────────────────────────────────────── */
  playCountdown(cb: () => void) {
    if (!this.ctx) return;

    const ctx = this.ctx;

    [0, 0.9, 1.8].forEach((d) => {
      const o = ctx.createOscillator();
      o.type = "sine"; o.frequency.value = 880;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.42, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.22);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.25);
    });

    const og = ctx.createOscillator();
    og.type = "sine"; og.frequency.value = 1320;
    const gg = ctx.createGain();
    gg.gain.setValueAtTime(0.55, ctx.currentTime + 2.7);
    gg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.1);
    og.connect(gg); gg.connect(ctx.destination);
    og.start(ctx.currentTime + 2.7); og.stop(ctx.currentTime + 3.2);

    setTimeout(cb, 2800);
  }

  /* ─────────────────────────────────────────────
     VICTORY
  ───────────────────────────────────────────── */
  playVictory() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "triangle"; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.38);
    });
  }

  /* ─────────────────────────────────────────────
     LAP CHIME
  ───────────────────────────────────────────── */
  playLapChime() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    [880, 1047, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine"; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.28);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.15);
      o.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  }
}