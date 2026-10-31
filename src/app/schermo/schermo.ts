import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Api, ora, ripeti } from '../api';
import { Sussurri } from '../squadra/sussurri';

interface Scena {
  id?: number; tipo: string; titolo: string; testo: string;
  allegato?: { url: string; tipo: string } | null; inOndaDal?: string;
  squadre?: Array<{ nome: string; colore: string; aperte: number }>; totaleProve?: number;
  annuncio?: string; rivelata?: boolean;
  soluzione?: { colpevole: string; movente: string; arma: string };
  vincitori?: Array<{ nome: string; consegnata_alle: string }>;
}
interface StatoSchermo {
  versione: string; titolo: string; stato: string; schermoNero: boolean; adesso: string;
  fase: { numero: number; nome: string | null; avviata: string | null; durataMinuti: number | null; elenco: Array<{ numero: number; nome: string }> };
  scena: Scena;
  sfondo: { url: string; opacita: number } | null;
}

@Component({
  selector: 'app-schermo',
  imports: [Sussurri],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './schermo.css',
  templateUrl: './schermo.html',
  host: { '(click)': 'attiva()' },
})
export class Schermo implements OnInit, OnDestroy {
  private api = inject(Api);
  private router = inject(Router);
  readonly s = signal<StatoSchermo | null>(null);
  readonly attivo = signal(false);
  readonly adesso = signal(Date.now());
  readonly ora = ora;
  private scarto = 0;
  private ferma?: () => void;
  private orologio?: ReturnType<typeof setInterval>;
  private media = viewChild<ElementRef<HTMLMediaElement>>('media');

  readonly tipo = computed(() => {
    const s = this.s();
    if (!s) return 'attesa';
    if (s.schermoNero) return 'nero';
    return s.scena.tipo;
  });

  readonly resto = computed(() => {
    const f = this.s()?.fase;
    if (!f?.avviata || !f.durataMinuti) return null;
    const fine = new Date(f.avviata).getTime() + f.durataMinuti * 60_000;
    const sec = Math.max(0, Math.round((fine - (this.adesso() + this.scarto)) / 1000));
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  });

  readonly etichettaFase = computed(() => {
    const f = this.s()?.fase;
    if (!f || f.numero === 0) return 'Prima di cominciare';
    return `Fase ${f.numero} · ${f.nome ?? ''}`;
  });

  constructor() {
    effect(() => {
      if (this.api.sessioneScaduta()) this.router.navigateByUrl('/accesso');
    });
    let ultimaScena: number | undefined;
    effect(() => {
      // Il media riparte da capo solo quando cambia la scena, non a ogni aggiornamento dello stato.
      const m = this.media()?.nativeElement;
      const id = this.s()?.scena.id;
      if (!m || id === ultimaScena) return;
      ultimaScena = id;
      if (this.attivo()) { m.currentTime = 0; m.play().catch(() => undefined); }
    });
  }

  ngOnInit() {
    this.ferma = ripeti(async () => {
      const t0 = Date.now();
      const s = await this.api.get<StatoSchermo>('/api/schermo/stato');
      this.scarto = new Date(s.adesso).getTime() - (t0 + Date.now()) / 2;
      this.s.set(s);
    }, 2000);
    this.orologio = setInterval(() => this.adesso.set(Date.now()), 1000);
    navigator.wakeLock?.request('screen').catch(() => undefined);
  }

  ngOnDestroy() {
    this.ferma?.();
    clearInterval(this.orologio);
  }

  attiva() {
    if (this.attivo()) return;
    this.attivo.set(true);
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    navigator.wakeLock?.request('screen').catch(() => undefined);
    const m = this.media()?.nativeElement;
    m?.play().catch(() => undefined);
  }

  stato(numero: number) {
    const n = this.s()?.fase.numero ?? 0;
    return numero < n ? 'passata' : numero === n ? 'corrente' : '';
  }

  nomiVincitori() {
    return (this.s()?.scena.vincitori ?? []).map((v) => v.nome).join(', ');
  }

  quota(aperte: number) {
    const t = this.s()?.scena.totaleProve || 1;
    return Math.min(1, aperte / t);
  }
}
