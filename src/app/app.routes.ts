import { Routes } from '@angular/router';
import { soloAdmin, soloPer } from './sessione';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'accesso' },
  { path: 'accesso', loadComponent: () => import('./pagine/accesso').then((m) => m.Accesso), title: 'Cena con delitto' },
  { path: 'regia/accedi', loadComponent: () => import('./pagine/accesso').then((m) => m.AccessoRegia), title: 'Entra nella regia, Il Movente' },
  { path: 's/:slug', loadComponent: () => import('./pagine/accesso').then((m) => m.AccessoSerata), title: 'Entra nella serata' },
  { path: 'avvio', loadComponent: () => import('./pagine/accesso').then((m) => m.Avvio), title: 'Primo avvio, Il Movente' },
  { path: 'invito/:token', loadComponent: () => import('./pagine/invito').then((m) => m.InvitoVista), title: 'Il tuo accesso, Il Movente' },
  { path: 'admin', canMatch: [soloAdmin], loadComponent: () => import('./pagine/admin').then((m) => m.AdminVista), title: 'Amministrazione, Il Movente' },
  {
    path: 'squadra',
    canMatch: [soloPer('squadra')],
    loadComponent: () => import('./squadra/squadra').then((m) => m.SquadraShell),
    children: [
      { path: '', loadComponent: () => import('./squadra/prove').then((m) => m.ProveVista), title: 'Le prove' },
      { path: 'personaggi', loadComponent: () => import('./squadra/altre').then((m) => m.PersonaggiVista), title: 'I personaggi' },
      { path: 'taccuino', loadComponent: () => import('./squadra/altre').then((m) => m.TaccuinoVista), title: 'Il taccuino' },
      { path: 'accusa', loadComponent: () => import('./squadra/altre').then((m) => m.AccusaVista), title: "L'accusa" },
    ],
  },
  { path: 'schermo', canMatch: [soloPer('schermo', 'regia')], loadComponent: () => import('./schermo/schermo').then((m) => m.Schermo), title: 'Proiettore' },
  {
    path: 'regia',
    canMatch: [soloPer('regia')],
    children: [
      { path: '', loadComponent: () => import('./regia/serate').then((m) => m.SerateVista), title: 'Le tue serate' },
      {
        path: 's/:serata',
        loadComponent: () => import('./regia/regia').then((m) => m.RegiaShell),
        children: [
          { path: '', loadComponent: () => import('./regia/diretta').then((m) => m.DirettaVista), title: 'Regia, in diretta' },
          { path: 'scene', loadComponent: () => import('./regia/altre').then((m) => m.SceneRegia), title: 'Regia, scene' },
          { path: 'caso', loadComponent: () => import('./regia/caso').then((m) => m.CasoVista), title: 'Regia, il caso' },
          { path: 'personaggi', loadComponent: () => import('./regia/caso').then((m) => m.PersonaggiRegia), title: 'Regia, personaggi' },
          { path: 'prove', loadComponent: () => import('./regia/prove').then((m) => m.ProveRegia), title: 'Regia, prove e codici' },
          { path: 'squadre', loadComponent: () => import('./regia/altre').then((m) => m.SquadreRegia), title: 'Regia, squadre e accessi' },
          { path: 'invitati', loadComponent: () => import('./regia/invitati').then((m) => m.InvitatiRegia), title: 'Regia, invitati' },
          { path: 'invitati/biglietti', loadComponent: () => import('./regia/invitati').then((m) => m.BigliettiRegia), title: 'Regia, biglietti per i tavoli' },
          { path: 'accuse', loadComponent: () => import('./regia/altre').then((m) => m.AccuseRegia), title: 'Regia, accuse' },
          { path: 'strumenti', loadComponent: () => import('./regia/altre').then((m) => m.Strumenti), title: 'Regia, strumenti' },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'accesso' },
];
