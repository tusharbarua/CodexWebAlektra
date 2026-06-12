import { IntegrationProvider, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DailyProductionInput = {
  source: string;
  provider?: IntegrationProvider;
  externalPlantId?: string;
  date: Date;
  kwhGenerated: number;
  rawPayload?: Prisma.InputJsonValue;
};

const CO2_TONS_PER_KWH = 0.000684;
const TREES_PER_TON_CO2 = 189.27;
const FLIGHTS_PER_TON_CO2 = 21.07;

export function convertKwhToImpact(kwhGenerated: number) {
  const co2OffsetTons = kwhGenerated * CO2_TONS_PER_KWH;
  return {
    co2OffsetTons,
    treesEquivalent: co2OffsetTons * TREES_PER_TON_CO2,
    flightsAvoided: co2OffsetTons * FLIGHTS_PER_TON_CO2
  };
}

export async function appendDailyProduction(input: DailyProductionInput) {
  const impact = convertKwhToImpact(input.kwhGenerated);

  await prisma.impactDailyLedger.upsert({
    where: {
      source_externalPlantId_date: {
        source: input.source,
        externalPlantId: input.externalPlantId ?? "manual",
        date: input.date
      }
    },
    update: {
      kwhGenerated: input.kwhGenerated,
      co2OffsetTons: impact.co2OffsetTons,
      treesEquivalent: impact.treesEquivalent,
      flightsAvoided: impact.flightsAvoided,
      rawPayload: input.rawPayload
    },
    create: {
      source: input.source,
      provider: input.provider,
      externalPlantId: input.externalPlantId ?? "manual",
      date: input.date,
      kwhGenerated: input.kwhGenerated,
      co2OffsetTons: impact.co2OffsetTons,
      treesEquivalent: impact.treesEquivalent,
      flightsAvoided: impact.flightsAvoided,
      rawPayload: input.rawPayload
    }
  });

  return recalculateImpactSnapshot();
}

export async function recalculateImpactSnapshot() {
  const latest = await prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
  const ledger = await prisma.impactDailyLedger.aggregate({
    _sum: {
      kwhGenerated: true,
      co2OffsetTons: true,
      treesEquivalent: true,
      flightsAvoided: true
    }
  });

  if (!latest) {
    throw new Error("Impact baseline is missing. Create a manual baseline before syncing API production.");
  }

  const manual = latest.manualBaselineJson as {
    baseline?: {
      kwhGenerated?: number;
      co2OffsetTons?: number;
      equivalentTreesPlanted?: number;
      longHaulFlightsAvoided?: number;
    };
  };
  const baseline = manual.baseline ?? {
    kwhGenerated: Number(latest.kwhGenerated),
    co2OffsetTons: Number(latest.co2OffsetTons),
    equivalentTreesPlanted: Number(latest.equivalentTreesPlanted),
    longHaulFlightsAvoided: Number(latest.longHaulFlightsAvoided)
  };

  return prisma.impactSnapshot.update({
    where: { id: latest.id },
    data: {
      kwhGenerated: Number(baseline.kwhGenerated ?? 0) + Number(ledger._sum.kwhGenerated ?? 0),
      co2OffsetTons: Number(baseline.co2OffsetTons ?? 0) + Number(ledger._sum.co2OffsetTons ?? 0),
      equivalentTreesPlanted: Number(baseline.equivalentTreesPlanted ?? 0) + Number(ledger._sum.treesEquivalent ?? 0),
      longHaulFlightsAvoided: Number(baseline.longHaulFlightsAvoided ?? 0) + Number(ledger._sum.flightsAvoided ?? 0),
      lastCalculatedAt: new Date()
    }
  });
}

export async function getImpactSnapshot() {
  return prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "desc" } });
}
