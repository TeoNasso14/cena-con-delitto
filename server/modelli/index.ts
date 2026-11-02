import { maschere } from "./maschere.ts";
import type { Modello } from "./tipo.ts";
import { viaggio } from "./viaggio.ts";
import { villa } from "./villa.ts";

/** I modelli pronti, scritti nel codice. Quelli salvati dalle regie stanno nel database (tabella modello). */
export const MODELLI: Modello[] = [villa, viaggio, maschere];
