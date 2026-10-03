import { env } from "cloudflare:workers";
export function getRawDb() {
  if (!env.DB) throw new Error("Reservation database is unavailable");
  return env.DB;
}
