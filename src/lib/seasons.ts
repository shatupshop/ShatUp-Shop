// Seasonal themes: one tap re-skins the brand gradients (buttons, logo gradient,
// campaign pill). The active season lives on <html data-season="..."> and the
// colours are CSS vars in premium.css — nothing else needs to know about it.
export type SeasonId = "default" | "eid" | "sale" | "puja";

export const SEASONS: { id: SeasonId; label: string; dot: string }[] = [
  { id: "default", label: "Default", dot: "#ff5a0a" },
  { id: "eid", label: "Eid", dot: "#16a34a" },
  { id: "sale", label: "11.11", dot: "#a855f7" },
  { id: "puja", label: "Puja", dot: "#dc2626" }
];

export function isSeasonId(v: unknown): v is SeasonId {
  return v === "default" || v === "eid" || v === "sale" || v === "puja";
}
