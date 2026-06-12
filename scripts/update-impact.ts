import { prisma } from "../src/lib/prisma";
import { syncIntegration } from "../src/lib/monitoring-connectors";
import { recalculateImpactSnapshot } from "../src/lib/impact";

async function main() {
  const integrations = await prisma.monitoringIntegration.findMany({ where: { isEnabled: true } });
  let readings = 0;

  for (const integration of integrations) {
    readings += await syncIntegration(integration);
    await prisma.monitoringIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() }
    });
  }

  await recalculateImpactSnapshot();
  console.log(`Impact update complete. ${readings} readings appended.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
