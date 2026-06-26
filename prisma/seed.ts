import { PrismaClient, PublishStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "ChangeMeImmediately!2026", 12);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@alektraepc.com" },
    update: { passwordHash, role: Role.SUPER_ADMIN, isActive: true },
    create: {
      name: "Alektra Admin",
      email: process.env.ADMIN_EMAIL ?? "admin@alektraepc.com",
      passwordHash,
      role: Role.SUPER_ADMIN
    }
  });

  await prisma.seoMetadata.upsert({
    where: { route: "/" },
    update: {},
    create: {
      route: "/",
      title: "Alektra Renewable | Solar EPC, Thermal Inspection, Cleaning and Mapping in Bangladesh",
      description:
        "Alektra Renewable delivers rooftop, industrial and commercial solar EPC services with thermal inspection, panel cleaning and aerial mapping support across Bangladesh.",
      keywords: ["solar EPC Bangladesh", "net metering", "rooftop solar", "industrial solar", "Alektra Renewable"]
    }
  });

  await prisma.siteContent.upsert({
    where: { key: "company-introduction" },
    update: {},
    create: {
      key: "company-introduction",
      title: "Solar EPC Built For Bangladesh Industry",
      body:
        "Alektra EPC designs, engineers, procures, installs and commissions rooftop, industrial and commercial solar plants for businesses that want reliable energy, lower operating costs and measurable environmental gains. The team supports net metering, monitoring and long-term performance care from feasibility through handover.",
      status: PublishStatus.PUBLISHED
    }
  });

  await prisma.siteContent.upsert({
    where: { key: "mission" },
    update: {},
    create: {
      key: "mission",
      title: "Mission",
      body:
        "Accelerate clean-energy adoption in Bangladesh by delivering dependable solar EPC, inspection, cleaning and mapping services with disciplined engineering and transparent project execution.",
      status: PublishStatus.PUBLISHED
    }
  });

  await prisma.siteContent.upsert({
    where: { key: "vision" },
    update: {},
    create: {
      key: "vision",
      title: "Vision",
      body:
        "To become a trusted renewable-energy partner for commercial and industrial clients, helping every suitable roof and land asset generate cleaner, more economical power.",
      status: PublishStatus.PUBLISHED
    }
  });

  const existingImpact = await prisma.impactSnapshot.findFirst({ orderBy: { createdAt: "asc" } });
  const impactData = {
      plantsInOperation: 13,
      totalInstalledCapacityKw: 1240,
      kwhGenerated: 289569,
      equivalentTreesPlanted: 37475,
      co2OffsetTons: 198,
      longHaulFlightsAvoided: 4172,
      manualBaselineJson: {
        source: "Initial manual values seeded from brochure environmental benefit page and launch assumptions",
        rule: "Future API production is appended through ImpactDailyLedger and added to this stored baseline.",
        baseline: {
          kwhGenerated: 289569,
          co2OffsetTons: 198,
          equivalentTreesPlanted: 37475,
          longHaulFlightsAvoided: 4172
        }
      }
    };
  if (existingImpact) await prisma.impactSnapshot.update({ where: { id: existingImpact.id }, data: impactData });
  else await prisma.impactSnapshot.create({ data: impactData });

  const projects = [
    {
      title: "Industrial Rooftop Solar Plant",
      slug: "industrial-rooftop-solar-plant",
      clientName: "Confidential Manufacturing Client",
      location: "Dhaka Division",
      projectType: "Industrial rooftop",
      capacityKw: 420,
      summary:
        "Grid-tied rooftop system engineered for daytime industrial load reduction with net metering readiness and remote monitoring.",
      annualGeneration: 510000,
      annualSavingsBdt: 4800000
    },
    {
      title: "Commercial Net Metering System",
      slug: "commercial-net-metering-system",
      clientName: "Commercial Facility",
      location: "Chattogram",
      projectType: "Commercial rooftop",
      capacityKw: 165,
      summary:
        "Alektra EPC delivered design, procurement, installation, commissioning and utility coordination for a commercial solar plant.",
      annualGeneration: 198000,
      annualSavingsBdt: 2100000
    },
    {
      title: "Aerial Thermal Inspection Program",
      slug: "aerial-thermal-inspection-program",
      clientName: "Solar Asset Owner",
      location: "Bangladesh",
      projectType: "Alektra Thermal",
      capacityKw: 650,
      summary:
        "Thermal drone inspection workflow identifying hotspots, string-level anomalies and maintenance priorities for operating solar assets.",
      annualGeneration: 0,
      annualSavingsBdt: 0
    }
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: { ...project, capacityKw: project.capacityKw, status: PublishStatus.PUBLISHED }
    });
  }

  const categoryNames = [
    ["Solar Panels", "solar-panels", "Module types, efficiency, degradation, warranties and bankability."],
    ["Inverters", "inverters", "String, central and hybrid inverter selection, MPPT design and monitoring."],
    ["Mounting Structures", "mounting-structures", "Racking, roof loading, corrosion protection and wind-safe installation."],
    ["Cables", "cables", "DC/AC cable sizing, protection, routing and loss control."],
    ["Net Metering", "net-metering", "Utility coordination, export-import meters and billing economics."],
    ["Monitoring", "monitoring", "Plant visibility, alerting, PR tracking and inverter platform integrations."],
    ["Battery/ESS", "battery-ess", "Storage applications, backup, peak shaving and hybrid solar architecture."],
    ["Solar Economics", "solar-economics", "Savings, payback, tariff escalation and environmental benefits."]
  ];

  const categories = new Map<string, string>();
  for (const [name, slug, description] of categoryNames) {
    const category = await prisma.resourceCategory.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description }
    });
    categories.set(slug, category.id);
  }

  const articles = [
    {
      title: "Choosing Solar Modules For Industrial Roofs",
      slug: "choosing-solar-modules-industrial-roofs",
      category: "solar-panels",
      excerpt: "A practical guide to module type, efficiency, degradation and warranty fit for Bangladeshi C&I projects.",
      body:
        "A well-designed rooftop solar plant starts with module selection. Alektra evaluates module efficiency, temperature coefficient, product warranty, linear performance warranty, mechanical load rating and bankability. For industrial roofs, module choice must also fit available roof area, shading profile, maintenance access and mounting layout. High-efficiency mono PERC, TOPCon and bifacial modules can improve output where roof area is constrained, but the best choice is the one that balances yield, lifecycle cost and dependable supply."
    },
    {
      title: "Inverter Selection And Monitoring Basics",
      slug: "inverter-selection-monitoring-basics",
      category: "inverters",
      excerpt: "How string sizing, MPPT windows, monitoring portals and service access shape plant performance.",
      body:
        "Inverters convert DC power from modules into usable AC power and provide the operating data needed for reliable solar asset management. Alektra reviews DC/AC ratio, MPPT count, voltage windows, protection class, grid-code compliance, warranty and local service support. Monitoring portals such as SolisCloud, Sungrow iSolarCloud and SMA Sunny Portal can later feed production data into the Alektra impact ledger without overwriting manually entered baseline values."
    },
    {
      title: "Net Metering Economics",
      slug: "net-metering-economics",
      category: "net-metering",
      excerpt: "The brochure model shows annual usage of 466,533 kWh and monthly bill savings across the year.",
      body:
        "Alektra models solar savings against utility consumption, tariff assumptions and projected energy-cost escalation. The brochure energy page estimates annual usage of 466,533 kWh and applies a 3.0% yearly increase in energy cost. Monthly solar generation and bill reduction help clients understand payback, while net metering can improve economics by crediting eligible exported energy."
    },
    {
      title: "Mounting And Racking For Durable Solar Plants",
      slug: "mounting-racking-durable-solar-plants",
      category: "mounting-structures",
      excerpt: "Good racking protects the roof, modules and investment through wind, rain and maintenance cycles.",
      body:
        "Mounting structures must handle roof type, corrosion exposure, wind loading, tilt, row spacing and maintenance access. Alektra designs racking with disciplined anchoring, cable management, drainage awareness and structural review so the solar plant remains stable and serviceable through its operating life."
    }
  ];

  for (const article of articles) {
    await prisma.resourceArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        body: article.body,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        categoryId: categories.get(article.category)!,
        authorId: admin.id
      }
    });
  }

  const productCategories = [
    { name: "Solar Modules", slug: "solar-modules", description: "Tier-1 and commercial-grade PV modules." },
    { name: "Inverters", slug: "shop-inverters", description: "Grid-tied, hybrid and C&I inverter systems." },
    { name: "Mounting", slug: "shop-mounting", description: "Roof and ground mounting accessories." },
    { name: "Monitoring", slug: "shop-monitoring", description: "Meters, dataloggers and monitoring accessories." }
  ];

  const shopCategories = new Map<string, string>();
  for (const category of productCategories) {
    const row = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    });
    shopCategories.set(category.slug, row.id);
  }

  const products = [
    {
      name: "Alektra Mono TOPCon 580W Module",
      slug: "alektra-mono-topcon-580w-module",
      sku: "AL-PV-580-TOPCON",
      model: "AL580N",
      brand: "Alektra Approved",
      priceBdt: 18500,
      stockQuantity: 86,
      isFeatured: true,
      category: "solar-modules",
      shortDescription: "High-efficiency N-type module for C&I rooftop projects.",
      technicalDescription:
        "580W mono TOPCon PV module with high conversion efficiency, improved low-light response and durable mechanical load rating for commercial and industrial systems.",
      specifications: { wattage: "580W", cellType: "N-type TOPCon", warranty: "12-year product, 30-year linear output" }
    },
    {
      name: "Grid-Tied String Inverter 50kW",
      slug: "grid-tied-string-inverter-50kw",
      sku: "AL-INV-50K-GT",
      model: "GT50K",
      brand: "Alektra Approved",
      priceBdt: 420000,
      stockQuantity: 12,
      isFeatured: true,
      category: "shop-inverters",
      shortDescription: "C&I string inverter with multi-MPPT architecture and monitoring support.",
      technicalDescription:
        "50kW three-phase grid-tied inverter with multiple MPPT inputs, integrated protection and cloud monitoring readiness for industrial rooftops.",
      specifications: { acPower: "50kW", phase: "Three phase", monitoring: "Wi-Fi / LAN datalogger ready" }
    },
    {
      name: "Aluminium Rooftop Mounting Kit",
      slug: "aluminium-rooftop-mounting-kit",
      sku: "AL-MNT-ROOF-KIT",
      model: "RMK-CI",
      brand: "Alektra",
      priceBdt: 13500,
      stockQuantity: 140,
      isFeatured: false,
      category: "shop-mounting",
      shortDescription: "Corrosion-resistant mounting kit for commercial rooftop PV arrays.",
      technicalDescription:
        "Modular aluminium rail, clamps and fastener package engineered for clean installation, service access and roof-appropriate anchoring.",
      specifications: { material: "Anodized aluminium", application: "Rooftop", finish: "Corrosion resistant" }
    }
  ];

  await prisma.siteSettings.upsert({
    where: { singletonKey: "footer" },
    update: {
      contactEmail: "contact@alektraepc.com",
      contactPhone: "+880 1735954 844",
      address: "Dhaka, Bangladesh",
      footerDescription:
        "Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.",
      copyrightText: "Copyright (c) Alektra Renewable. All rights reserved."
    },
    create: {
      singletonKey: "footer",
      contactEmail: "contact@alektraepc.com",
      contactPhone: "+880 1735954 844",
      address: "Dhaka, Bangladesh",
      footerDescription:
        "Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.",
      copyrightText: "Copyright (c) Alektra Renewable. All rights reserved."
    }
  });

  const seededProductImages = [
    "/uploads/products/seed-solar-module.svg",
    "/uploads/products/seed-inverter.svg",
    "/uploads/products/seed-mounting.svg"
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        model: product.model,
        brand: product.brand,
        priceBdt: product.priceBdt,
        stockQuantity: product.stockQuantity,
        isFeatured: product.isFeatured,
        categoryId: shopCategories.get(product.category)!,
        status: PublishStatus.PUBLISHED,
        shortDescription: product.shortDescription,
        technicalDescription: product.technicalDescription,
        datasheetUrl: "/datasheets/request-from-admin.pdf",
        manualUrl: "/manuals/request-from-admin.pdf",
        specifications: product.specifications
      }
    });

    await prisma.productImage.deleteMany({ where: { productId: created.id } });
    await prisma.productImage.createMany({
      data: seededProductImages.map((imagePath, index) => ({
        productId: created.id,
        imagePath,
        altText: `${product.name} product image ${index + 1}`,
        sortOrder: index,
        isPrimary: index === 0
      }))
    });
  }

  await prisma.coupon.upsert({
    where: { code: "SOLAR5" },
    update: {},
    create: {
      code: "SOLAR5",
      description: "Launch discount",
      discountType: "PERCENT",
      amount: 5,
      minimumSpend: 25000,
      isActive: true
    }
  });

  await prisma.deliveryCharge.upsert({
    where: { zone: "Dhaka Metro" },
    update: {},
    create: { zone: "Dhaka Metro", description: "Standard delivery inside Dhaka", chargeBdt: 300, freeAboveBdt: 100000 }
  });

  await prisma.thermalPricingRule.upsert({
    where: { name: "Default" },
    update: {},
    create: {
      name: "Default",
      baseInspectionFeeBdt: 25000,
      ratePerKwpBdt: 45,
      distanceChargePerKmBdt: 0,
      minimumInspectionFeeBdt: 35000,
      standardMultiplier: 1,
      comprehensiveMultiplier: 1.6
    }
  });

  await prisma.deliveryCharge.upsert({
    where: { zone: "Outside Dhaka" },
    update: {},
    create: { zone: "Outside Dhaka", description: "Nationwide delivery by quotation", chargeBdt: 900, freeAboveBdt: 250000 }
  });

  console.log("Seed completed for Alektra Renewable.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
