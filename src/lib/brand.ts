export type DivisionKey = "epc" | "thermal" | "mapping" | "sparkle";

export const brandLogos: Record<DivisionKey, string> = {
  epc: "/brand/alektra-renewable-logo-asset-v3.png",
  thermal: "/brand/alektra-thermal-logo.png",
  mapping: "/brand/alektra-mapping-logo.png",
  sparkle: "/brand/alektra-sparkle-logo.png"
};

export const brandNames: Record<DivisionKey, string> = {
  epc: "Alektra Renewable",
  thermal: "Alektra Thermal",
  mapping: "Alektra Mapping",
  sparkle: "Alektra Sparkle"
};

export function getDivisionFromPath(pathname: string): DivisionKey {
  if (pathname.startsWith("/thermal")) return "thermal";
  if (pathname.startsWith("/mapping")) return "mapping";
  if (pathname.startsWith("/sparkle")) return "sparkle";
  return "epc";
}
