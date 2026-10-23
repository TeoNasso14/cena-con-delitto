// Lancia ng build e chiude quando Angular ha finito: in questo progetto un processo esbuild resta appeso
// dopo la compilazione e impedirebbe al comando di terminare (la build su Netlify andrebbe in timeout).
import { spawn } from "node:child_process";

const ng = spawn(process.execPath, ["node_modules/@angular/cli/bin/ng.js", "build"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NG_CLI_ANALYTICS: "false" },
  detached: true,
});

let esito = null;
const leggi = (dati) => {
  const t = dati.toString();
  process.stdout.write(t);
  if (/Application bundle generation complete/.test(t)) esito ??= 0;
  if (/Application bundle generation failed|\[ERROR\]/.test(t)) esito = 1;
  if (esito !== null && /Output location|generation failed/.test(t)) chiudi();
};
ng.stdout.on("data", leggi);
ng.stderr.on("data", leggi);
ng.on("exit", (code) => process.exit(esito ?? code ?? 1));

function chiudi() {
  setTimeout(() => {
    try { process.kill(-ng.pid, "SIGTERM"); } catch {}
    process.exit(esito);
  }, 1500);
}

setTimeout(() => { console.error("Build oltre 10 minuti: interrotta."); try { process.kill(-ng.pid, "SIGKILL"); } catch {} process.exit(1); }, 600_000);
