import { prisma } from "@/lib/prisma";

// Reserved for future use. Currently disabled from Thermal public request flow
// until a new distance calculation method is selected.
export const DEFAULT_THERMAL_BASE = {
  name: "Alektra Renewable Base",
  latitude: 22.3585575,
  longitude: 91.8196934
};

export type DistanceCalculation = {
  distanceFromBaseKm: number | null;
  distanceCalculationStatus: "calculated" | "missing_base_location" | "missing_project_coordinates" | "failed";
};

export async function getThermalBasePoint() {
  const row = await prisma.thermalBaseLocation.findUnique({ where: { singletonKey: "default" } }).catch(() => null);
  const latitude = Number(row?.latitude ?? DEFAULT_THERMAL_BASE.latitude);
  const longitude = Number(row?.longitude ?? DEFAULT_THERMAL_BASE.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    name: row?.name ?? DEFAULT_THERMAL_BASE.name,
    address: row?.address ?? null,
    googlePlaceId: row?.googlePlaceId ?? null,
    latitude,
    longitude
  };
}

export async function calculateThermalDistance(projectLatitude: number | null, projectLongitude: number | null): Promise<DistanceCalculation> {
  try {
    if (projectLatitude === null || projectLongitude === null) {
      return { distanceFromBaseKm: null, distanceCalculationStatus: "missing_project_coordinates" };
    }
    const base = await getThermalBasePoint();
    if (!base) return { distanceFromBaseKm: null, distanceCalculationStatus: "missing_base_location" };
    return {
      distanceFromBaseKm: haversineKm(base.latitude, base.longitude, projectLatitude, projectLongitude),
      distanceCalculationStatus: "calculated"
    };
  } catch {
    return { distanceFromBaseKm: null, distanceCalculationStatus: "failed" };
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radiusKm = 6371;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}
