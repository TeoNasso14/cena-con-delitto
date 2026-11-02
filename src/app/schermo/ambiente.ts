/*
 * Suoni d'ambiente del proiettore, generati nel browser con Web Audio: nessun file da scaricare e nessuna licenza.
 * Ogni tema ha un fondo continuo (rumore filtrato) e, se serve, piccoli eventi a caso: gocce, tic, colpi di rotaia, scoppiettii.
 * Il browser lascia partire l'audio solo dopo un tocco sullo schermo: per questo si accende con `attivo`.
 */

interface Desiderio { acceso: boolean; tema: string; volume: number; abbassa: boolean }

type Rumore = 'bianco' | 'rosa' | 'marrone';

export class Ambiente {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tema: string | null = null;
  private fonti: AudioScheduledSourceNode[] = [];
  private nodi: AudioNode[] = [];
  private eventi?: ReturnType<typeof setInterval>;
  private buffer = new Map<Rumore, AudioBuffer>();

  aggiorna(d: Desiderio) {
    if (!d.acceso || d.volume <= 0) { this.spegni(); return; }
    if (!this.ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
    }
    this.ctx.resume().catch(() => undefined);
    if (this.tema !== d.tema) this.suona(d.tema);
    // Volume con dissolvenza; durante scene con audio o video il fondo resta appena accennato.
    const g = (d.volume / 100) * 0.6 * (d.abbassa ? 0.15 : 1);
    const t = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(t);
    this.master!.gain.setTargetAtTime(g, t, 0.6);
  }

  spegni() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.master?.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    this.ctx = null;
    this.tema = null;
    clearInterval(this.eventi);
    setTimeout(() => ctx.close().catch(() => undefined), 2000);
    this.fonti = [];
    this.nodi = [];
    this.buffer.clear();
  }

  private pulisci() {
    clearInterval(this.eventi);
    for (const f of this.fonti) { try { f.stop(); } catch { /* già ferma */ } }
    for (const n of this.nodi) n.disconnect();
    this.fonti = [];
    this.nodi = [];
  }

  private rumore(tipo: Rumore) {
    const ctx = this.ctx!;
    let b = this.buffer.get(tipo);
    if (!b) {
      b = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const x = b.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, ultimo = 0;
      for (let i = 0; i < x.length; i++) {
        const w = Math.random() * 2 - 1;
        if (tipo === 'bianco') x[i] = w * 0.5;
        else if (tipo === 'rosa') { b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; x[i] = (b0 + b1 + b2 + w * 0.02) * 2.2; }
        else { ultimo = (ultimo + 0.02 * w) / 1.02; x[i] = ultimo * 3.5; }
      }
      this.buffer.set(tipo, b);
    }
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.loop = true;
    return s;
  }

  /** Un fondo continuo: rumore, filtro, volume, e un'onda lenta che lo fa respirare. */
  private fondo(tipo: Rumore, filtro: BiquadFilterType, freq: number, q: number, volume: number, respiro = 0, lento = 0.08) {
    const ctx = this.ctx!;
    const s = this.rumore(tipo);
    const f = ctx.createBiquadFilter();
    f.type = filtro; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = volume;
    s.connect(f).connect(g).connect(this.master!);
    s.start();
    this.fonti.push(s);
    this.nodi.push(f, g);
    if (respiro) {
      const lfo = ctx.createOscillator();
      const quanto = ctx.createGain();
      lfo.frequency.value = lento;
      quanto.gain.value = respiro;
      lfo.connect(quanto).connect(f.frequency);
      lfo.start();
      this.fonti.push(lfo);
      this.nodi.push(quanto);
    }
  }

  /** Un colpo breve di rumore filtrato, al tempo `t`: goccia, tic, colpo di rotaia, scoppiettio. */
  private colpo(t: number, freq: number, durata: number, volume: number, filtro: BiquadFilterType = 'bandpass', q = 8) {
    const ctx = this.ctx!;
    const s = this.rumore('bianco');
    const f = ctx.createBiquadFilter();
    f.type = filtro; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    s.connect(f).connect(g).connect(this.master!);
    s.start(t, Math.random() * 3, durata + 0.05);
    s.onended = () => { f.disconnect(); g.disconnect(); };
  }

  /** Ripete `fai` ogni 100 ms, con gli eventi programmati poco avanti nel tempo dell'audio. */
  private ogni(fai: (ora: number) => void) {
    this.eventi = setInterval(() => { if (this.ctx) fai(this.ctx.currentTime); }, 100);
  }

  private suona(tema: string) {
    this.pulisci();
    this.tema = tema;
    const caso = Math.random;
    switch (tema) {
      case 'noir': // pioggia sulla città
        this.fondo('rosa', 'bandpass', 2400, 0.4, 0.5, 300, 0.05);
        this.fondo('marrone', 'lowpass', 300, 0.7, 0.25);
        this.ogni((t) => { for (let i = 0; i < 3; i++) if (caso() < 0.5) this.colpo(t + caso() * 0.1, 2500 + caso() * 3500, 0.03, 0.08 + caso() * 0.1); });
        break;
      case 'vittoriano': { // pendolo e pioggia lontana
        this.fondo('rosa', 'lowpass', 1200, 0.5, 0.25, 150, 0.04);
        let prossimo = this.ctx!.currentTime + 0.5;
        let pari = false;
        this.ogni((t) => {
          while (prossimo < t + 0.3) { this.colpo(prossimo, pari ? 3200 : 2600, 0.05, 0.35, 'bandpass', 14); pari = !pari; prossimo += 1; }
        });
        break;
      }
      case 'viaggio': { // treno in corsa: rombo basso e coppie di colpi sulle giunzioni
        this.fondo('marrone', 'lowpass', 180, 0.8, 0.9, 30, 0.2);
        this.fondo('rosa', 'bandpass', 700, 0.6, 0.12);
        let prossimo = this.ctx!.currentTime + 0.4;
        this.ogni((t) => {
          while (prossimo < t + 0.3) {
            this.colpo(prossimo, 160, 0.12, 0.7, 'lowpass', 1);
            this.colpo(prossimo + 0.16, 140, 0.12, 0.6, 'lowpass', 1);
            prossimo += 1.05 + caso() * 0.06;
          }
        });
        break;
      }
      case 'gatsby': // fruscio di un disco: soffio e crepitii
        this.fondo('rosa', 'highpass', 3000, 0.5, 0.08);
        this.fondo('marrone', 'lowpass', 120, 0.7, 0.15);
        this.ogni((t) => { if (caso() < 0.6) this.colpo(t + caso() * 0.1, 1500 + caso() * 5000, 0.008, 0.15 + caso() * 0.25, 'highpass', 0.7); });
        break;
      case 'natale': // fuoco nel camino
        this.fondo('marrone', 'lowpass', 500, 0.7, 0.55, 150, 0.3);
        this.ogni((t) => {
          if (caso() < 0.25) this.colpo(t + caso() * 0.1, 900 + caso() * 2500, 0.02 + caso() * 0.04, 0.2 + caso() * 0.4, 'bandpass', 3);
          if (caso() < 0.03) this.colpo(t + caso() * 0.1, 2000, 0.09, 0.6, 'bandpass', 2);
        });
        break;
      default: // halloween: vento tra gli alberi, che sale e scende
        this.fondo('marrone', 'bandpass', 500, 1.2, 0.9, 350, 0.07);
        this.fondo('rosa', 'bandpass', 1400, 3, 0.12, 600, 0.11);
    }
  }
}
