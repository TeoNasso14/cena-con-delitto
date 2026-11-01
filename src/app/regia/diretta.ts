import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, ora } from '../api';
import { Icona } from '../icona';
import { RegiaStato, SquadraR, TIPI_SCENA } from './stato';

interface EsitoConsegna { aperta: number; mostrata: number; gia: number; catena?: number[] }

@Component({
  selector: 'app-diretta',
  imports: [FormsModule, RouterLink, Icona],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .rivela { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding-top: 4px; }
    .rivela .secondario { font-size: 14px; }
    .anteprima { position: relative; aspect-ratio: 16 / 9; max-width: 100%; border-radius: 10px; background: var(--fondo); overflow: hidden; padding: 28px 6%;
      display: flex; flex-direction: column; justify-content: center; gap: 6px; }
    .anteprima .luna { position: absolute; width: 82%; aspect-ratio: 1; border-radius: 50%; background: var(--accento); right: -40%; top: 50%; transform: translateY(-50%); }
    .anteprima.nero .luna { display: none; }
    .anteprima strong { position: relative; font-family: var(--titoli); font-size: clamp(18px, 2.4vw, 28px); line-height: 1; max-width: 46%; }
    .anteprima small { position: relative; color: var(--testo-2); max-width: 46%; }
    .anteprima .stato { position: absolute; left: 10px; top: 10px; z-index: 1; }
    .media-onda { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: var(--fondo); }
    .vedi { display: flex; justify-content: flex-end; }
    .prossima { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 15px; color: var(--testo-2); }
    .prossima b { color: var(--testo-1); font-weight: 600; }
    .comandi { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .comandi .bottone { padding: 0 16px; }
    .scelta-scene { display: flex; flex-wrap: wrap; gap: 8px; }
    .scelta-scene button { min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--filetto); background: transparent; font-size: 14px; color: var(--testo-2); }
    .scelta-scene button.in-onda { border-color: var(--accento); color: var(--accento); font-weight: 700; }
    @media (hover: hover) { .scelta-scene button:hover { color: var(--testo-1); border-color: var(--testo-2); } }
    .squadra-testa { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .squadra-testa b { font-size: 17px; display: flex; align-items: center; gap: 8px; }
    .pallino { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .squadra-testa span { color: var(--testo-2); font-size: 15px; }
    .tacche { display: grid; gap: 4px; }
    .tacche i { height: 8px; border-radius: 4px; background: var(--fondo-3); }
    .tacche i.si { background: var(--accento); }
    .nota-squadra { font-size: 14px; color: var(--testo-2); }
    .nota-squadra.ferma { color: var(--allarme); font-weight: 600; }
    .registro { list-style: none; margin: 0; padding: 4px 16px; background: var(--fondo-2); border-radius: 14px; max-height: 520px; overflow-y: auto; }
    .registro li { display: grid; grid-template-columns: 52px 1fr; gap: 10px; padding: 11px 0; border-bottom: 1px solid var(--fondo-3); font-size: 15px; }
    .registro li:last-child { border-bottom: 0; }
    .registro time { color: var(--testo-2); }
    .registro .pin_errato { color: var(--allarme); }
    .fasi-rapide { display: flex; flex-wrap: wrap; gap: 8px; }
  `,
  template: `
    @let t = st.t()!;
    @let s = t.serata;
    <header class="r-testa">
      <div>
        <h1>{{ faseCorrente()?.nome ?? (s.stato === 'bozza' ? 'Prima di cominciare' : 'In diretta') }}</h1>
        <p>{{ descrizione() }}</p>
      </div>
      <div class="r-azioni">
        @if (s.stato === 'in_corso') {
          <button class="bottone" type="button" (click)="statoSerata('in_pausa')">Pausa</button>
        } @else if (s.stato === 'in_pausa') {
          <button class="bottone" type="button" (click)="statoSerata('in_corso')">Riprendi</button>
        }
        @if (prossimaFase(); as f) {
          <button class="bottone bottone--pieno" type="button" (click)="avviaFase(f.numero)">Avvia fase {{ f.numero }}, {{ f.nome }}</button>
        } @else if (!t.fasi.length) {
          <a class="bottone bottone--pieno" routerLink="/regia/caso">Prepara le fasi</a>
        }
      </div>
    </header>

    <div class="r-colonne">
      <div class="r-colonna">
        <section class="r-blocco" aria-labelledby="t-onda">
          <h2 id="t-onda">In onda</h2>
          <div class="r-scheda">
            <div class="anteprima" [class.nero]="s.schermo_nero">
              <span class="r-pillola r-pillola--accento stato">{{ s.schermo_nero ? 'Schermo nero' : 'In onda' }}</span>
              @if (!s.schermo_nero && scenaInOnda()?.allegato_key && scenaInOnda()!.tipo === 'immagine') {
                <img class="media-onda" [src]="'/api/file/' + scenaInOnda()!.allegato_key" alt="">
              } @else if (!s.schermo_nero && scenaInOnda()?.allegato_key && scenaInOnda()!.tipo === 'video') {
                <video class="media-onda" [src]="'/api/file/' + scenaInOnda()!.allegato_key + '#t=0.5'" muted playsinline preload="metadata"></video>
              } @else {
                <span class="luna" aria-hidden="true"></span>
              }
              @if (!s.schermo_nero && !haMedia()) {
                <strong>{{ scenaInOnda()?.titolo || nomeTipo(scenaInOnda()?.tipo ?? 'attesa') }}</strong>
                @if (scenaInOnda()?.titolo) { <small>{{ nomeTipo(scenaInOnda()!.tipo) }}</small> }
              }
            </div>
            @if (haMedia() && !s.schermo_nero && scenaInOnda()?.titolo) { <p class="secondario" style="font-size:14px">{{ scenaInOnda()!.titolo }}</p> }
            <div class="prossima">
              <span>Poi: <b>{{ prossimaScena()?.titolo || (prossimaScena() ? nomeTipo(prossimaScena()!.tipo) : 'nessuna scena') }}</b></span>
              <span>{{ posizione() }}</span>
            </div>
            <div class="comandi">
              <button class="bottone bottone--pieno" type="button" (click)="successiva()" [disabled]="!prossimaScena()"><app-icona nome="avanti" />Scena successiva</button>
              <button class="bottone" type="button" (click)="nero(!s.schermo_nero)">{{ s.schermo_nero ? 'Riaccendi' : 'Schermo nero' }}</button>
            </div>
            <div class="rivela">
                @if (s.rivelata) {
                  <span class="r-pillola r-pillola--accento">Soluzione rivelata sul proiettore</span>
                  <button class="r-link" type="button" (click)="nascondi()">Nascondi di nuovo la soluzione</button>
                } @else if (!s.colpevole) {
                  <p class="secondario">Per rivelare serve la soluzione: scrivila in <a routerLink="/regia/caso">Il caso e le fasi</a>.</p>
                } @else if (confermaRivela()) {
                  <button class="bottone bottone--pieno" type="button" (click)="rivela()">Sì, rivela sul proiettore</button>
                  <button class="bottone" type="button" (click)="confermaRivela.set(false)">Non ancora</button>
                } @else {
                  <button class="bottone bottone--pieno" type="button" (click)="confermaRivela.set(true)">Rivela la soluzione</button>
                  <span class="secondario">{{ notaRivela() }}</span>
                }
            </div>
            <div class="vedi"><a class="r-link" href="/schermo" target="_blank" rel="noopener">Apri il proiettore in un'altra scheda</a></div>
            @if (t.scene.length) {
              <div class="scelta-scene" role="group" aria-label="Manda in onda una scena">
                @for (sc of t.scene; track sc.id) {
                  <button type="button" [class.in-onda]="sc.id === s.scena_in_onda" (click)="manda(sc.id)">{{ sc.titolo || nomeTipo(sc.tipo) }}</button>
                }
              </div>
            } @else {
              <p class="secondario">Nessuna scena. <a routerLink="/regia/scene">Preparale qui</a>.</p>
            }
          </div>
        </section>

        <section class="r-blocco" aria-labelledby="t-intervieni">
          <h2 id="t-intervieni">Intervieni</h2>
          <form class="r-scheda r-modulo" (ngSubmit)="consegna()">
            <label class="etichetta" for="c-prova">Consegna una prova <small>Se la prova ha un codice, la squadra la vede sigillata con il titolo e la apre digitando il codice. Compaiono con il titolo anche le prove che vengono dopo, ognuna con le sue condizioni.</small>
              <select id="c-prova" name="c-prova" class="campo" [(ngModel)]="consegnaProva" required>
                <option [ngValue]="null" disabled>Scegli la prova</option>
                @for (p of t.prove; track p.id) { <option [ngValue]="p.id">N. {{ p.numero }}, {{ p.titolo }}</option> }
              </select>
            </label>
            <label class="etichetta" for="c-chi">A chi
              <select id="c-chi" name="c-chi" class="campo" [(ngModel)]="consegnaA">
                <option [ngValue]="null">A tutte le squadre</option>
                @for (q of t.squadre; track q.id) { <option [ngValue]="q.id">Solo a {{ q.nome }}</option> }
              </select>
            </label>
            <button class="bottone bottone--pieno" type="submit" [disabled]="!consegnaProva">Consegna ora</button>
          </form>
          <form class="r-scheda r-modulo" (ngSubmit)="annuncia()">
            <label class="etichetta" for="annuncio">Annuncio <small>Arriva sui telefoni. Sul proiettore compare con la scena "Ultimo annuncio".</small>
              <textarea id="annuncio" name="annuncio" class="campo" rows="3" [(ngModel)]="annuncio" placeholder="Tra dieci minuti si spengono le luci."></textarea>
            </label>
            <label class="etichetta" for="a-chi">A chi
              <select id="a-chi" name="a-chi" class="campo" [(ngModel)]="annuncioA">
                <option [ngValue]="null">A tutte le squadre</option>
                @for (q of t.squadre; track q.id) { <option [ngValue]="q.id">Solo a {{ q.nome }}</option> }
              </select>
            </label>
            <button class="bottone" type="submit" [disabled]="!annuncio.trim()">Manda l'annuncio</button>
          </form>
        </section>
      </div>

      <div class="r-colonna">
        <section class="r-blocco" aria-labelledby="t-squadre">
          <h2 id="t-squadre">Le squadre</h2>
          @for (q of t.squadre; track q.id) {
            <div class="r-scheda">
              <div class="squadra-testa"><b><span class="pallino" [style.background]="q.colore"></span>{{ q.nome }}</b><span>{{ q.aperte }} prove su {{ t.totaleProve }}</span></div>
              <div class="tacche" [style.grid-template-columns]="'repeat(' + (t.totaleProve || 1) + ', minmax(0, 1fr))'" aria-hidden="true">
                @for (p of t.prove; track p.id) { <i [class.si]="q.prove_aperte.includes(p.id)"></i> }
              </div>
              <p class="nota-squadra" [class.ferma]="ferma(q)">{{ notaSquadra(q) }}</p>
              @if (ferma(q) && prossimaPerSquadra(q); as p) {
                <button class="bottone bottone--piccolo" type="button" style="justify-self:start" (click)="aiutino(q, p.id)">Consegna la n. {{ p.numero }} come aiutino</button>
              }
            </div>
          } @empty {
            <p class="r-vuoto">Nessuna squadra. <a routerLink="/regia/squadre">Creale qui</a> con i loro accessi.</p>
          }
        </section>

        <section class="r-blocco" aria-labelledby="t-registro">
          <h2 id="t-registro">Cosa succede</h2>
          @if (t.eventi.length) {
            <ol class="registro">
              @for (e of t.eventi; track e.id) { <li><time>{{ ora(e.ora) }}</time><span [class]="e.tipo">{{ e.testo }}</span></li> }
            </ol>
          } @else {
            <p class="r-vuoto">Qui compare tutto quello che succede: prove aperte, codici sbagliati, annunci, scene in onda.</p>
          }
        </section>
      </div>
    </div>
  `,
})
export class DirettaVista {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly ora = ora;
  readonly adesso = signal(Date.now());
  consegnaProva: number | null = null;
  consegnaA: number | null = null;
  annuncio = '';
  annuncioA: number | null = null;

  constructor() {
    const id = setInterval(() => this.adesso.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  readonly faseCorrente = computed(() => {
    const t = this.st.t();
    return t?.fasi.find((f) => f.numero === t.serata.fase_corrente) ?? null;
  });
  readonly prossimaFase = computed(() => {
    const t = this.st.t();
    return t?.fasi.find((f) => f.numero === t.serata.fase_corrente + 1) ?? null;
  });
  readonly scenaInOnda = computed(() => {
    const t = this.st.t();
    return t?.scene.find((s) => s.id === t.serata.scena_in_onda) ?? null;
  });
  readonly haMedia = computed(() => {
    const sc = this.scenaInOnda();
    return !!sc?.allegato_key && (sc.tipo === 'immagine' || sc.tipo === 'video');
  });
  readonly prossimaScena = computed(() => {
    const t = this.st.t();
    if (!t) return null;
    const i = t.scene.findIndex((s) => s.id === t.serata.scena_in_onda);
    return t.scene[i + 1] ?? null;
  });
  readonly posizione = computed(() => {
    const t = this.st.t();
    if (!t?.scene.length) return '';
    const i = t.scene.findIndex((s) => s.id === t.serata.scena_in_onda);
    return i < 0 ? `${t.scene.length} scene` : `${i + 1} di ${t.scene.length}`;
  });
  readonly descrizione = computed(() => {
    const t = this.st.t()!;
    const s = t.serata;
    const stati = { bozza: 'Serata in preparazione', in_corso: 'Serata in corso', in_pausa: 'Serata in pausa', chiusa: 'Serata chiusa' };
    const fase = this.faseCorrente();
    const parti = [fase ? `Fase ${fase.numero} di ${t.fasi.length}, iniziata alle ${ora(fase.avviata_alle)}` : stati[s.stato]];
    parti.push(`${t.squadre.length} squadre`);
    return parti.join('. ') + '.';
  });

  nomeTipo(t: string) { return TIPI_SCENA[t] ?? t; }

  minutiFermi(q: SquadraR) {
    const t = this.st.t()!;
    const fase = this.faseCorrente();
    const rif = q.ultima_prova ?? fase?.avviata_alle;
    if (!rif || t.serata.stato !== 'in_corso') return 0;
    return Math.floor((this.adesso() - new Date(rif).getTime()) / 60_000);
  }
  ferma(q: SquadraR) { return this.minutiFermi(q) >= 12 && q.aperte < this.st.t()!.totaleProve; }
  notaSquadra(q: SquadraR) {
    if (this.ferma(q)) return `Ferma da ${this.minutiFermi(q)} minuti`;
    const parti = [q.ultima_prova ? `Ultima prova alle ${ora(q.ultima_prova)}` : 'Nessuna prova ancora'];
    parti.push(q.codici_sbagliati ? `${q.codici_sbagliati} codici sbagliati` : 'nessun errore');
    return parti.join(', ');
  }
  prossimaPerSquadra(q: SquadraR) {
    return this.st.t()!.prove.find((p) => !q.prove_aperte.includes(p.id) && !(q.prove_mostrate ?? []).includes(p.id)) ?? null;
  }

  statoSerata(stato: string) { this.st.fai(() => this.api.post('/api/regia/stato', { stato }), stato === 'in_pausa' ? 'Serata in pausa' : 'Si riparte'); }
  avviaFase(numero: number) { this.st.fai(() => this.api.post('/api/regia/fase', { numero }), `Fase ${numero} iniziata`); }
  readonly confermaRivela = signal(false);
  readonly haRivelazione = computed(() => !!this.st.t()?.scene.some((x) => x.tipo === 'rivelazione'));
  readonly notaRivela = computed(() => {
    if (this.scenaInOnda()?.tipo === 'rivelazione') return 'Il proiettore mostra colpevole, movente, arma e chi ha indovinato.';
    if (this.haRivelazione()) return 'Il proiettore passa alla scena di rivelazione e mostra colpevole, movente, arma e chi ha indovinato.';
    return "Non c'è una scena di rivelazione: creala in Scene del proiettore, altrimenti il proiettore non mostra la soluzione.";
  });
  nascondi() { this.st.fai(() => this.api.post('/api/regia/nascondi-soluzione'), 'Soluzione nascosta: il proiettore torna all\'attesa'); }
  rivela() { this.confermaRivela.set(false); this.st.fai(() => this.api.post('/api/regia/rivela'), 'Soluzione rivelata'); }
  successiva() { this.st.fai(() => this.api.post('/api/regia/onda/successiva'), 'Scena successiva in onda'); }
  manda(id: number) { this.st.fai(() => this.api.post('/api/regia/onda', { scena_id: id }), 'In onda'); }
  nero(nero: boolean) { this.st.fai(() => this.api.post('/api/regia/schermo-nero', { nero }), nero ? 'Schermo nero' : 'Schermo riacceso'); }
  async consegna() {
    const r = await this.st.fai(() => this.api.post<EsitoConsegna>('/api/regia/consegna', { prova_id: this.consegnaProva, squadra_id: this.consegnaA }));
    if (r) { this.consegnaProva = null; this.st.dimmi(this.esitoConsegna(r, 'Prova consegnata')); }
  }
  async aiutino(q: SquadraR, provaId: number) {
    const r = await this.st.fai(() => this.api.post<EsitoConsegna>('/api/regia/consegna', { prova_id: provaId, squadra_id: q.id }));
    if (r) this.st.dimmi(this.esitoConsegna(r, `Aiutino consegnato a ${q.nome}`));
  }
  private esitoConsegna(r: EsitoConsegna, aperta: string) {
    const n = r.catena ?? [];
    const catena = !n.length ? '' : n.length === 1 ? `. A catena compare anche la n. ${n[0]}` : `. A catena compaiono anche le n. ${n.join(', ')}`;
    if (r.mostrata && !r.aperta) return 'Prova mostrata con il titolo: si apre quando la squadra digita il suo codice' + catena;
    if (!r.mostrata && !r.aperta) return (n.length ? 'La prova c\'era già' : 'Le squadre avevano già questa prova') + catena;
    return aperta + catena;
  }
  async annuncia() {
    const ok = await this.st.fai(() => this.api.post('/api/regia/annunci', { testo: this.annuncio, squadra_id: this.annuncioA }), 'Annuncio mandato');
    if (ok) this.annuncio = '';
  }
}
