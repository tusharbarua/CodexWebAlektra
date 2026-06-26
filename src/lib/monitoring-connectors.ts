import { IntegrationProvider, Prisma, type MonitoringIntegration } from "@prisma/client";
import { appendDailyProduction } from "@/lib/impact";

export type ProductionReading = {
  externalPlantId: string;
  date: Date;
  kwhGenerated: number;
  rawPayload: Prisma.InputJsonValue;
};

export interface MonitoringConnector {
  provider: IntegrationProvider;
  fetchDailyProduction(integration: MonitoringIntegration): Promise<ProductionReading[]>;
}

async function placeholderFetch(provider: IntegrationProvider, integration: MonitoringIntegration) {
  if (!integration.isEnabled) return [];
  throw new Error(`${provider} connector requires provider credentials and endpoint mapping before first production sync.`);
}

export const connectors: Record<IntegrationProvider, MonitoringConnector> = {
  SOLISCLOUD: {
    provider: IntegrationProvider.SOLISCLOUD,
    fetchDailyProduction: (integration) => placeholderFetch(IntegrationProvider.SOLISCLOUD, integration)
  },
  SUNGROW_ISOLARCLOUD: {
    provider: IntegrationProvider.SUNGROW_ISOLARCLOUD,
    fetchDailyProduction: (integration) => placeholderFetch(IntegrationProvider.SUNGROW_ISOLARCLOUD, integration)
  },
  SMA_SUNNY_PORTAL: {
    provider: IntegrationProvider.SMA_SUNNY_PORTAL,
    fetchDailyProduction: (integration) => placeholderFetch(IntegrationProvider.SMA_SUNNY_PORTAL, integration)
  },
  GENERIC: {
    provider: IntegrationProvider.GENERIC,
    fetchDailyProduction: (integration) => placeholderFetch(IntegrationProvider.GENERIC, integration)
  }
};

export async function syncIntegration(integration: MonitoringIntegration) {
  const connector = connectors[integration.provider];
  const readings = await connector.fetchDailyProduction(integration);

  for (const reading of readings) {
    await appendDailyProduction({
      source: integration.label,
      provider: integration.provider,
      externalPlantId: reading.externalPlantId,
      date: reading.date,
      kwhGenerated: reading.kwhGenerated,
      rawPayload: reading.rawPayload
    });
  }

  return readings.length;
}
