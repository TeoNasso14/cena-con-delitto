import type { Config } from "@netlify/functions";
import { gestisci } from "../../server/router.ts";

export default async (req: Request) => gestisci(req);

export const config: Config = {
  path: "/api/*",
};
