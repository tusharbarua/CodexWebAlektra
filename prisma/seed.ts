import { PageKey, Prisma, PrismaClient, PublishStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { comprehensivePoints, standardPoints, thermalAnomalies } from "../src/data/thermal";
import { legalDefaults } from "../src/lib/legal-documents";
import { defaultRefundContent, defaultTermsContent } from "../src/lib/shop-legal";

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

  const permissionModules = ["Dashboard", "Pages", "Products", "Categories", "Orders", "Projects", "Resources", "Hero Media", "Footer Settings", "Legal Content", "SEO", "Integrations", "Thermal Inspections", "Contact Submissions", "Users", "Roles", "Site Settings"];
  const permissionActions = ["View", "Create", "Edit", "Delete", "Publish", "Export", "Manage Settings"];
  const defaultRoles = ["Super Admin", "Director", "Admin", "Sales", "Engineer", "HR", "Accounts", "Store Manager", "Viewer"];
  const roleRows = new Map<string, string>();
  for (const roleName of defaultRoles) {
    const role = await prisma.appRole.upsert({
      where: { name: roleName },
      update: { isSystem: ["Super Admin", "Admin", "Viewer"].includes(roleName) },
      create: { name: roleName, isSystem: ["Super Admin", "Admin", "Viewer"].includes(roleName) }
    });
    roleRows.set(roleName, role.id);
  }
  const superAdminRoleId = roleRows.get("Super Admin")!;
  await prisma.appRolePermission.deleteMany({ where: { roleId: superAdminRoleId } });
  await prisma.appRolePermission.createMany({
    data: permissionModules.flatMap((module) => permissionActions.map((action) => ({ roleId: superAdminRoleId, module, action })))
  });
  await prisma.user.update({ where: { id: admin.id }, data: { appRoleId: superAdminRoleId } });
  await seedSubdivisionPages();

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
    ["Inverter", "inverters", "String, central and hybrid inverter selection, MPPT design and monitoring.", "Zap", 10],
    ["ESS", "battery-ess", "Storage applications, backup, peak shaving and hybrid solar architecture.", "BatteryCharging", 20],
    ["Design", "design", "Project design, sizing, energy modeling and engineering decisions.", "CircuitBoard", 30],
    ["Mounting", "mounting-structures", "Racking, roof loading, corrosion protection and wind-safe installation.", "Boxes", 40],
    ["Cable", "cables", "DC/AC cable sizing, protection, routing and loss control.", "Cable", 50],
    ["Solar Module", "solar-panels", "Module types, efficiency, degradation, warranties and bankability.", "Sun", 60],
    ["Tracker", "tracker", "Solar tracker concepts, yield impact and utility-scale applications.", "Activity", 70],
    ["BOS", "bos", "Balance-of-system components, protection, combiner boxes and accessories.", "PanelTop", 80],
    ["Net Metering", "net-metering", "Utility coordination, export-import meters and billing economics.", "Gauge", 90],
    ["O&M", "monitoring", "Plant visibility, alerting, PR tracking and inverter platform integrations.", "MonitorCheck", 100],
    ["Thermal Inspection", "thermal-inspection", "Aerial thermal inspection, anomaly detection and asset diagnostics.", "Radar", 110],
    ["Cleaning", "cleaning", "Solar panel cleaning, soiling loss and long-term performance care.", "Droplets", 120],
    ["Mapping", "mapping", "Drone mapping, photogrammetry, LiDAR and digital twin documentation.", "Map", 130],
    ["Others", "others", "Additional renewable-energy topics and practical project guidance.", "BookOpen", 140],
    ["Solar Economics", "solar-economics", "Savings, payback, tariff escalation and environmental benefits.", "LineChart", 150]
  ];

  const categories = new Map<string, string>();
  for (const [name, slug, description, icon, sortOrder] of categoryNames) {
    const categorySlug = String(slug);
    const category = await prisma.resourceCategory.upsert({
      where: { slug: categorySlug },
      update: { name: String(name), description: String(description), icon: String(icon), sortOrder: Number(sortOrder), status: PublishStatus.PUBLISHED },
      create: { name: String(name), slug: categorySlug, description: String(description), icon: String(icon), sortOrder: Number(sortOrder), status: PublishStatus.PUBLISHED }
    });
    categories.set(categorySlug, category.id);
  }

  const articles = [
    {
      title: "Choosing Solar Modules For Industrial Roofs",
      slug: "choosing-solar-modules-industrial-roofs",
      category: "solar-panels",
      excerpt: "A practical guide to module type, efficiency, degradation and warranty fit for Bangladeshi C&I projects.",
      isFeatured: true,
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
        isFeatured: "isFeatured" in article ? Boolean(article.isFeatured) : false,
        readTimeMinutes: Math.max(1, Math.ceil(article.body.split(/\s+/).length / 180)),
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        categoryId: categories.get(article.category)!,
        authorId: admin.id
      }
    });
  }

  const ecommerceCategories = [
    { name: "Solar Module", slug: "solar-module", description: "PV modules for commercial, industrial and residential solar systems.", icon: "solar-module", sortOrder: 10 },
    { name: "Inverter", slug: "inverter", description: "On-grid, off-grid and hybrid inverter systems.", icon: "inverter", sortOrder: 20 },
    { name: "Hybrid Inverter", slug: "hybrid-inverter", description: "Hybrid inverter systems for solar and battery integration.", icon: "hybrid-inverter", sortOrder: 21, parentSlug: "inverter" },
    { name: "Offgrid Inverter", slug: "offgrid-inverter", description: "Off-grid inverter systems for independent power applications.", icon: "offgrid-inverter", sortOrder: 22, parentSlug: "inverter" },
    { name: "On Grid Inverter", slug: "on-grid-inverter", description: "Grid-tied inverter systems for net metering and C&I PV plants.", icon: "on-grid-inverter", sortOrder: 23, parentSlug: "inverter" },
    { name: "Battery", slug: "battery", description: "Battery and ESS-ready storage equipment.", icon: "battery", sortOrder: 30 },
    { name: "Cable", slug: "cable", description: "Solar DC, AC and communication cables.", icon: "cable", sortOrder: 40 },
    { name: "Mounting System", slug: "mounting-system", description: "Roof and ground mounting structures.", icon: "mounting-system", sortOrder: 50 },
    { name: "Balance Of System (BOS)", slug: "balance-of-system-bos", description: "Combiner boxes, breakers, protection and electrical accessories.", icon: "bos", sortOrder: 60 }
  ];

  const shopCategories = new Map<string, string>();
  for (const category of ecommerceCategories.filter((item) => !item.parentSlug)) {
    const row = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, icon: category.icon, sortOrder: category.sortOrder, status: PublishStatus.PUBLISHED },
      create: { name: category.name, slug: category.slug, description: category.description, icon: category.icon, sortOrder: category.sortOrder, status: PublishStatus.PUBLISHED }
    });
    shopCategories.set(category.slug, row.id);
  }
  for (const category of ecommerceCategories.filter((item) => item.parentSlug)) {
    const row = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, icon: category.icon, sortOrder: category.sortOrder, status: PublishStatus.PUBLISHED, parentId: shopCategories.get(category.parentSlug!) },
      create: { name: category.name, slug: category.slug, description: category.description, icon: category.icon, sortOrder: category.sortOrder, status: PublishStatus.PUBLISHED, parentId: shopCategories.get(category.parentSlug!) }
    });
    shopCategories.set(category.slug, row.id);
  }
  const legacyCategoryMap = {
    "solar-modules": shopCategories.get("solar-module")!,
    "shop-inverters": shopCategories.get("on-grid-inverter")!,
    "shop-mounting": shopCategories.get("mounting-system")!,
    "shop-monitoring": shopCategories.get("balance-of-system-bos")!
  };
  for (const [legacySlug, targetCategoryId] of Object.entries(legacyCategoryMap)) {
    const legacy = await prisma.productCategory.findUnique({ where: { slug: legacySlug } });
    if (legacy) {
      await prisma.product.updateMany({ where: { categoryId: legacy.id }, data: { categoryId: targetCategoryId } });
      await prisma.productCategory.update({ where: { id: legacy.id }, data: { status: PublishStatus.UNPUBLISHED, sortOrder: 999 } });
    }
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
      },
      {
        name: "Alektra Mono PERC 550W Module",
        slug: "alektra-mono-perc-550w-module",
        sku: "AL-PV-550-PERC",
        model: "AL550M",
        brand: "Alektra Approved",
        priceBdt: 16800,
        stockQuantity: 120,
        isFeatured: false,
        category: "solar-module",
        shortDescription: "Commercial mono PERC module for reliable rooftop solar output.",
        technicalDescription: "550W mono PERC PV module selected for dependable C&I rooftop deployment, low degradation and strong mechanical reliability.",
        specifications: { wattage: "550W", cellType: "Mono PERC", warranty: "12-year product warranty" }
      },
      {
        name: "Hybrid Solar Inverter 10kW",
        slug: "hybrid-solar-inverter-10kw",
        sku: "AL-HYB-10K",
        model: "HYB10K",
        brand: "Alektra Approved",
        priceBdt: 285000,
        stockQuantity: 9,
        isFeatured: true,
        category: "hybrid-inverter",
        shortDescription: "Hybrid inverter for PV, grid and battery-ready energy systems.",
        technicalDescription: "10kW hybrid inverter with battery integration, backup support and smart monitoring for resilient solar systems.",
        specifications: { acPower: "10kW", battery: "Lithium compatible", monitoring: "Wi-Fi ready" }
      },
      {
        name: "Offgrid Inverter 5kW",
        slug: "offgrid-inverter-5kw",
        sku: "AL-OFF-5K",
        model: "OFF5K",
        brand: "Alektra Approved",
        priceBdt: 145000,
        stockQuantity: 16,
        isFeatured: false,
        category: "offgrid-inverter",
        shortDescription: "Off-grid inverter for standalone solar backup applications.",
        technicalDescription: "5kW off-grid inverter designed for battery-backed independent power systems and remote solar installations.",
        specifications: { acPower: "5kW", phase: "Single phase", application: "Off-grid backup" }
      },
      {
        name: "On Grid String Inverter 20kW",
        slug: "on-grid-string-inverter-20kw",
        sku: "AL-INV-20K-GT",
        model: "GT20K",
        brand: "Alektra Approved",
        priceBdt: 225000,
        stockQuantity: 18,
        isFeatured: false,
        category: "on-grid-inverter",
        shortDescription: "Three-phase on-grid inverter for commercial rooftop systems.",
        technicalDescription: "20kW grid-tied string inverter with MPPT optimization and protection functions for net-metered PV systems.",
        specifications: { acPower: "20kW", phase: "Three phase", protection: "Integrated DC/AC protection" }
      },
      {
        name: "Lithium Battery Pack 5.12kWh",
        slug: "lithium-battery-pack-512kwh",
        sku: "AL-BAT-5KWH",
        model: "LFP5120",
        brand: "Alektra Approved",
        priceBdt: 185000,
        stockQuantity: 14,
        isFeatured: true,
        category: "battery",
        shortDescription: "LFP battery module for hybrid solar and backup systems.",
        technicalDescription: "5.12kWh lithium iron phosphate battery pack with scalable installation support for hybrid and ESS-ready projects.",
        specifications: { capacity: "5.12kWh", chemistry: "LFP", lifecycle: "6000 cycles class" }
      },
      {
        name: "Solar DC Cable 6mm",
        slug: "solar-dc-cable-6mm",
        sku: "AL-CAB-DC6",
        model: "PV1-F-6",
        brand: "Alektra Approved",
        priceBdt: 145,
        stockQuantity: 1200,
        isFeatured: false,
        category: "cable",
        shortDescription: "UV-resistant solar DC cable for PV string wiring.",
        technicalDescription: "6mm solar DC cable suitable for rooftop and ground-mounted PV array wiring with outdoor-rated insulation.",
        specifications: { size: "6mm", rating: "PV1-F", application: "DC string wiring" }
      },
      {
        name: "MC4 Connector Pair",
        slug: "mc4-connector-pair",
        sku: "AL-BOS-MC4",
        model: "MC4-PAIR",
        brand: "Alektra Approved",
        priceBdt: 280,
        stockQuantity: 450,
        isFeatured: false,
        category: "balance-of-system-bos",
        shortDescription: "PV connector pair for reliable module string connection.",
        technicalDescription: "MC4-compatible connector pair for PV string installation and maintenance replacement work.",
        specifications: { type: "MC4 compatible", rating: "PV DC", unit: "Pair" }
      },
      {
        name: "DC Combiner Box 4 String",
        slug: "dc-combiner-box-4-string",
        sku: "AL-BOS-DC4",
        model: "DCB-4S",
        brand: "Alektra",
        priceBdt: 18500,
        stockQuantity: 24,
        isFeatured: false,
        category: "balance-of-system-bos",
        shortDescription: "String combiner box with DC protection components.",
        technicalDescription: "4-string DC combiner box for solar PV systems, designed for organized string protection and service access.",
        specifications: { strings: "4", protection: "Fuse/SPD ready", application: "PV DC side" }
      },
      {
        name: "Standing Seam Roof Clamp Set",
        slug: "standing-seam-roof-clamp-set",
        sku: "AL-MNT-SEAM",
        model: "SSC-SET",
        brand: "Alektra",
        priceBdt: 9500,
        stockQuantity: 80,
        isFeatured: false,
        category: "mounting-system",
        shortDescription: "Clamp set for standing seam industrial rooftops.",
        technicalDescription: "Non-penetrating standing seam roof clamp set for suitable industrial roof profiles and PV mounting layouts.",
        specifications: { material: "Aluminium", roofType: "Standing seam", installation: "Non-penetrating" }
      }
    ];

  await prisma.siteSettings.upsert({
    where: { singletonKey: "footer" },
    update: {
      contactEmail: "contact@alektraepc.com",
      contactPhone: "+880 1735 954 844",
      secondaryPhone: "+880 1877 572 234",
      address: "Chattogram | Dhaka | Bangladesh",
      footerDescription:
        "Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.",
      copyrightText: "Copyright (c) Alektra Renewable. All rights reserved."
    },
    create: {
      singletonKey: "footer",
      contactEmail: "contact@alektraepc.com",
      contactPhone: "+880 1735 954 844",
      secondaryPhone: "+880 1877 572 234",
      address: "Chattogram | Dhaka | Bangladesh",
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
    const seededFeatures = [
      product.shortDescription,
      `Model ${product.model}`,
      `${product.brand} supply and after-sales coordination`
    ];
    const seededProductData = {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      model: product.model,
      brand: product.brand,
      priceBdt: product.priceBdt,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      categoryId: legacyCategoryMap[product.category as keyof typeof legacyCategoryMap] ?? shopCategories.get(product.category)!,
      status: PublishStatus.PUBLISHED,
      shortDescription: product.shortDescription,
      technicalDescription: product.technicalDescription,
      keyFeatures: seededFeatures,
      warrantyNote: "Warranty and service support available as per product category and supplier terms.",
      supportNote: "Alektra can support product selection, installation planning and commissioning coordination.",
      datasheetUrl: "/datasheets/request-from-admin.pdf",
      manualUrl: "/manuals/request-from-admin.pdf",
      specifications: product.specifications
    };
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: seededProductData,
      create: seededProductData
    });

    await prisma.productImage.deleteMany({ where: { productId: created.id } });
      const primaryImage = product.category.includes("inverter")
        ? "/uploads/products/seed-inverter.svg"
        : product.category.includes("mounting")
          ? "/uploads/products/seed-mounting.svg"
          : "/uploads/products/seed-solar-module.svg";
      const productImages = [primaryImage, ...seededProductImages.filter((imagePath) => imagePath !== primaryImage)];
      await prisma.productImage.createMany({
        data: productImages.map((imagePath, index) => ({
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

  await prisma.ecommerceDeliverySetting.upsert({
    where: { singletonKey: "default" },
    update: {
      courierEnabled: true,
      courierMinimumChargeBdt: 200,
      pickupEnabled: true,
      pickupLabel: "Pick up from our warehouse",
      pickupAddress: "Khulshi, Chattogram",
      pickupChargeBdt: 0
    },
    create: {
      singletonKey: "default",
      courierEnabled: true,
      courierMinimumChargeBdt: 200,
      pickupEnabled: true,
      pickupLabel: "Pick up from our warehouse",
      pickupAddress: "Khulshi, Chattogram",
      pickupChargeBdt: 0
    }
  });

  await prisma.ecommerceCheckoutSetting.upsert({
    where: { singletonKey: "default" },
    update: { requireOtpVerification: false },
    create: { singletonKey: "default", requireOtpVerification: false }
  });

  await prisma.paymentInstructionSetting.upsert({
    where: { singletonKey: "default" },
    update: {
      manualBankTransferEnabled: true,
      showBankInstructionInEmail: true,
      bankAccountName: "ALEKTRA RENEWABLE",
      bankName: "Dutch Bangla Bank Ltd",
      branchName: "OR Nizam Road",
      accountNumber: "1291100024117",
      routingNumber: "090151480",
      paymentEmail: "contact@alektraepc.com",
      paymentInstructionText: "After completing payment, please reply to this email with your deposit slip/payment receipt, or send it to our WhatsApp. Please write your order number clearly so that we can trace your payment quickly."
    },
    create: {
      singletonKey: "default",
      manualBankTransferEnabled: true,
      showBankInstructionInEmail: true,
      bankAccountName: "ALEKTRA RENEWABLE",
      bankName: "Dutch Bangla Bank Ltd",
      branchName: "OR Nizam Road",
      accountNumber: "1291100024117",
      routingNumber: "090151480",
      paymentEmail: "contact@alektraepc.com",
      paymentInstructionText: "After completing payment, please reply to this email with your deposit slip/payment receipt, or send it to our WhatsApp. Please write your order number clearly so that we can trace your payment quickly."
    }
  });

  await prisma.shopLegalContent.upsert({
    where: { policyKey: "terms" },
    update: { title: "Alektra Renewable Shop Terms & Conditions", slug: "shop-terms", content: defaultTermsContent, version: "v1.0", status: PublishStatus.PUBLISHED },
    create: { policyKey: "terms", title: "Alektra Renewable Shop Terms & Conditions", slug: "shop-terms", content: defaultTermsContent, version: "v1.0", effectiveDate: new Date(), status: PublishStatus.PUBLISHED }
  });

  await prisma.shopLegalContent.upsert({
    where: { policyKey: "refund" },
    update: { title: "Alektra Renewable Shop Refund, Return & Replacement Policy", slug: "shop-refund-policy", content: defaultRefundContent, version: "v1.0", status: PublishStatus.PUBLISHED },
    create: { policyKey: "refund", title: "Alektra Renewable Shop Refund, Return & Replacement Policy", slug: "shop-refund-policy", content: defaultRefundContent, version: "v1.0", effectiveDate: new Date(), status: PublishStatus.PUBLISHED }
  });

  for (const document of Object.values(legalDefaults)) {
    await prisma.legalDocument.upsert({
      where: { documentKey: document.documentKey },
      update: {
        title: document.title,
        slug: document.slug,
        content: document.content,
        version: "v1.0",
        status: PublishStatus.PUBLISHED
      },
      create: {
        documentKey: document.documentKey,
        title: document.title,
        slug: document.slug,
        content: document.content,
        version: "v1.0",
        effectiveDate: new Date(),
        status: PublishStatus.PUBLISHED,
        updatedBy: "seed"
      }
    });
  }

  await prisma.messagingIntegration.upsert({
    where: { singletonKey: "default" },
    update: {},
    create: {
      singletonKey: "default",
      providerName: "Not configured",
      isEnabled: false,
      otpTemplate: "Your Alektra Renewable OTP is [OTP]. It expires in 5 minutes.",
      orderConfirmationTemplate: "Your Alektra Renewable order #[ORDER_NUMBER] has been received. Total: BDT [TOTAL]. We will contact you shortly."
    }
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

  await prisma.thermalBaseLocation.upsert({
    where: { singletonKey: "default" },
    update: {},
    create: {
      singletonKey: "default",
      name: "Alektra Renewable Base",
      latitude: 22.3585575,
      longitude: 91.8196934
    }
  });

  await prisma.deliveryCharge.upsert({
    where: { zone: "Outside Dhaka" },
    update: {},
    create: { zone: "Outside Dhaka", description: "Nationwide delivery by quotation", chargeBdt: 900, freeAboveBdt: 250000 }
  });

  console.log("Seed completed for Alektra Renewable.");
}

async function seedSubdivisionPages() {
  await seedThermalPage();
  await seedSparklePage();
  await seedMappingPage();
  await seedEpcPage();
}

async function upsertPage(pageKey: PageKey, title: string, slug: string, metaTitle: string, metaDescription: string) {
  return prisma.page.upsert({
    where: { pageKey },
    update: { title, slug, metaTitle, metaDescription, status: PublishStatus.PUBLISHED },
    create: { pageKey, title, slug, metaTitle, metaDescription, status: PublishStatus.PUBLISHED }
  });
}

async function upsertSection(pageId: string, data: {
  sectionKey: string;
  sectionType: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  sortOrder: number;
  isPublished?: boolean;
  settingsJson?: Prisma.InputJsonValue;
}) {
  return prisma.pageSection.upsert({
    where: { pageId_sectionKey: { pageId, sectionKey: data.sectionKey } },
    update: data,
    create: { pageId, ...data }
  });
}

async function replaceItems(sectionId: string, items: Array<{
  title: string;
  subtitle?: string | null;
  body?: string | null;
  icon?: string | null;
  imagePath?: string | null;
  videoPath?: string | null;
  linkText?: string | null;
  linkUrl?: string | null;
  badge?: string | null;
  sortOrder: number;
  settingsJson?: Prisma.InputJsonValue;
  isPublished?: boolean;
}>) {
  const existing = await prisma.pageSectionItem.count({ where: { sectionId } });
  if (existing > 0) return;
  await prisma.pageSectionItem.createMany({
    data: items.map((item) => ({ sectionId, isPublished: true, ...item }))
  });
}

async function seedEpcPage() {
  const page = await upsertPage(
    PageKey.epc,
    "Alektra Renewable",
    "epc",
    "Alektra Renewable | Premium Solar EPC Bangladesh",
    "Professional solar EPC, hybrid energy systems, monitoring, thermal inspection, cleaning, mapping, and performance care for commercial and industrial clients."
  );

  await prisma.heroMedia.updateMany({ where: { pageKey: PageKey.epc }, data: { isPrimary: false } });
  const epcHeroMedia = await prisma.heroMedia.findFirst({ where: { pageKey: PageKey.epc, filePath: "/uploads/hero/epc/epc-hero-video.mp4" } });
  if (epcHeroMedia) {
    await prisma.heroMedia.update({
      where: { id: epcHeroMedia.id },
      data: { title: "Alektra Renewable EPC Hero Video", mediaType: "video", url: "/uploads/hero/epc/epc-hero-video.mp4", filePath: "/uploads/hero/epc/epc-hero-video.mp4", alt: "Alektra Renewable solar EPC hero video", altText: "Alektra Renewable solar EPC hero video", isPrimary: true, isPublished: true, status: PublishStatus.PUBLISHED }
    });
  } else {
    await prisma.heroMedia.create({
      data: {
        pageKey: PageKey.epc,
        title: "Alektra Renewable EPC Hero Video",
        mediaType: "video",
        url: "/uploads/hero/epc/epc-hero-video.mp4",
        filePath: "/uploads/hero/epc/epc-hero-video.mp4",
        alt: "Alektra Renewable solar EPC hero video",
        altText: "Alektra Renewable solar EPC hero video",
        mimeType: "video/mp4",
        isPrimary: true,
        isPublished: true,
        status: PublishStatus.PUBLISHED,
        sortOrder: 0
      }
    });
  }

  const hero = await upsertSection(page.id, {
    sectionKey: "hero",
    sectionType: "epc-hero",
    title: "Alektra Renewable",
    subtitle: "Engineering Reliable Solar Energy Systems for Industries, Commercial Buildings, and Future-Ready Businesses",
    body: "Alektra Renewable delivers professional solar EPC solutions, hybrid energy systems, monitoring support, thermal inspection, cleaning, mapping, and long-term performance care for commercial and industrial clients. We combine engineering precision, premium components, advanced digital tools, and after-sales support to help businesses generate cleaner energy with confidence.",
    sortOrder: 10,
    settingsJson: {
      kicker: "Solar EPC Excellence for Bangladesh's Industrial Future",
      primaryCtaText: "Explore Our EPC Solutions",
      primaryCtaLink: "#solutions",
      secondaryCtaText: "View Our Projects",
      secondaryCtaLink: "#projects",
      tertiaryCtaText: "Request a Proposal",
      tertiaryCtaLink: "#proposal",
      trustBadges: ["C&I Solar EPC", "Hybrid & ESS Ready", "Thermal Inspection", "Sparkle Cleaning", "Mapping & Digital Twin"]
    }
  });
  await replaceItems(hero.id, []);

  await upsertSection(page.id, {
    sectionKey: "impact",
    sectionType: "impact-dashboard",
    title: "Renewable energy creating measurable change.",
    subtitle: "Live Impact Dashboard",
    body: "Every operating plant contributes to cleaner air, lower emissions, and a more resilient energy future for Bangladesh.",
    sortOrder: 20
  });

  const different = await upsertSection(page.id, {
    sectionKey: "what-makes-us-different",
    sectionType: "feature-cards",
    title: "What Makes Us Different",
    subtitle: "Engineering Difference",
    body: "Beyond installation, Alektra Renewable protects your asset, your roof, your energy performance, and your long-term confidence.",
    sortOrder: 30
  });
  await replaceItems(different.id, [
    ["We Care for Your Roof", "We prioritize roof protection and minimize unnecessary penetrations. Where anchoring is required, we follow proper waterproofing practices to help maintain roof integrity and support reliable, professional solar installation.", "ShieldCheck"],
    ["Global Engineering Strength", "Our engineering capability is supported by experienced professionals and collaborators across borders. This helps us deliver accurate design, better technical review, and high-quality project execution with precision.", "Globe2"],
    ["Strong Monitoring Team", "Our monitoring team keeps a close eye on system performance so that issues can be identified quickly. Clients also benefit from advanced monitoring platforms provided by leading inverter manufacturers.", "MonitorCheck"],
    ["Quick Replacement Support", "In the event of eligible equipment failure, our support process helps clients raise replacement requests quickly and coordinate replacement units as efficiently as possible.", "PackageCheck"],
    ["Complimentary Aerial Thermal Inspection", "Eligible clients receive 100% discount on aerial thermal inspection from our in-house Alektra Thermal team for up to 3 years, including AI-assisted reporting and anomaly detection support.", "Radar"],
    ["Complimentary Alektra Sparkle Cleaning", "Eligible clients receive 100% discount on professional solar panel cleaning from Alektra Sparkle. Our module-safe cleaning approach helps protect performance and supports long-term asset care.", "Droplets"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const solutions = await upsertSection(page.id, {
    sectionKey: "epc-solutions",
    sectionType: "capability-cards",
    title: "Solar EPC Solutions Built for Performance",
    subtitle: "EPC Capabilities",
    body: "Practical engineering, quality procurement, careful installation, and long-term operating support for commercial and industrial clients.",
    sortOrder: 40
  });
  await replaceItems(solutions.id, [
    ["Commercial & Industrial Rooftop Solar", "Structured solar EPC for factories, warehouses, commercial roofs, and operating facilities.", "Building2"],
    ["Hybrid Solar & Energy Storage Systems", "Future-ready solar architectures with battery and energy storage readiness where suitable.", "BatteryCharging"],
    ["Net Metering Support", "Documentation and technical coordination support for eligible net-metered solar projects.", "Zap"],
    ["Electrical Design & Engineering", "Electrical layouts, component sizing, protection philosophy, and performance-focused design review.", "CircuitBoard"],
    ["Procurement & Quality Components", "Component selection aligned with warranty, service support, project conditions, and lifecycle value.", "Boxes"],
    ["Installation, Testing & Commissioning", "Field execution with safety supervision, testing discipline, handover documentation, and commissioning care.", "CheckCircle2"],
    ["Remote Monitoring & O&M Support", "Monitoring support and performance follow-up for dependable long-term operation.", "MonitorCheck"],
    ["Performance Analytics & Reporting", "Operating insight through production data, reporting, inspection, cleaning, and mapping services.", "FileText"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  await upsertSection(page.id, {
    sectionKey: "projects-showcase",
    sectionType: "project-showcase",
    title: "Our Projects",
    subtitle: "Featured Delivery",
    body: "A premium project showcase connected to the existing project CMS. Published projects appear here automatically.",
    sortOrder: 50
  });

  const objectives = await upsertSection(page.id, {
    sectionKey: "objectives",
    sectionType: "objective-cards",
    title: "Our Objectives",
    subtitle: "Our Direction",
    body: "We are building Alektra Renewable to accelerate clean-energy adoption with engineering quality, responsible execution, and long-term client value.",
    sortOrder: 60
  });
  await replaceItems(objectives.id, [
    ["Promote Renewable Energy Adoption", "Our primary objective is to accelerate the adoption of renewable energy, particularly solar energy, in Bangladesh. We aim to contribute meaningfully to the country's transition toward cleaner and more sustainable energy sources.", "Sun"],
    ["Set New Standards of Quality", "We strive to establish a new benchmark of excellence in the solar energy industry through sound engineering practices, advanced technology, quality components, structured execution, and customer-focused delivery.", "Award"],
    ["Support Energy Independence", "We help clients reduce reliance on conventional power sources by delivering reliable and efficient solar solutions. Our systems are designed to support greater control over long-term energy costs and operational resilience.", "BatteryCharging"],
    ["Foster Environmental Stewardship", "Environmental responsibility is central to our mission. Through wider adoption of solar energy, we aim to reduce emissions, support climate action, and contribute to a greener future for Bangladesh and beyond.", "Leaf"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const ecosystem = await upsertSection(page.id, {
    sectionKey: "ecosystem",
    sectionType: "ecosystem-cards",
    title: "One Renewable Energy Ecosystem",
    subtitle: "Alektra Ecosystem",
    body: "EPC delivery, thermal inspection, module cleaning, and mapping intelligence under one connected renewable-energy platform.",
    sortOrder: 70
  });
  await replaceItems(ecosystem.id, [
    ["Alektra EPC", "Solar EPC, hybrid systems, engineering, and project execution.", "Sun", "/", "EPC"],
    ["Alektra Thermal", "Drone-based thermal inspection, AI-assisted anomaly detection, and asset diagnostics.", "Radar", "/thermal", "Thermal"],
    ["Alektra Sparkle", "Professional solar panel cleaning for industrial and commercial systems.", "Sparkles", "/sparkle", "Sparkle"],
    ["Alektra Mapping", "Drone mapping, photogrammetry, LiDAR, and digital twin visualization.", "Map", "/mapping", "Mapping"]
  ].map(([title, body, icon, linkUrl, badge], index) => ({ title, body, icon, linkUrl, badge, sortOrder: index })));

  const process = await upsertSection(page.id, {
    sectionKey: "delivery-process",
    sectionType: "process-steps",
    title: "How We Deliver Reliable Solar Projects",
    subtitle: "Project Discipline",
    body: "A structured project path helps reduce uncertainty and keeps commercial solar delivery accountable from concept to performance care.",
    sortOrder: 80
  });
  await replaceItems(process.id, [
    ["Requirement Review", "We understand energy goals, operating context, roof condition, and project constraints."],
    ["Site Assessment & Data Collection", "Site information, load profile, structural considerations, and utility details are collected."],
    ["Engineering Design", "The technical solution is designed around safety, yield, accessibility, and lifecycle performance."],
    ["Proposal & Financial Evaluation", "Clients receive a clear technical and commercial view for decision-making."],
    ["Procurement & Quality Control", "Major components are selected and coordinated around project specifications and support."],
    ["Installation & Safety Supervision", "Field work is supervised with attention to roof protection, electrical safety, and execution quality."],
    ["Testing, Commissioning & Handover", "The system is tested, commissioned, documented, and handed over with operating clarity."],
    ["Monitoring, Support & Performance Care", "Long-term care is supported through monitoring, inspection, cleaning, mapping, and reporting."]
  ].map(([title, body], index) => ({ title, body, sortOrder: index })));

  const quality = await upsertSection(page.id, {
    sectionKey: "quality-trust",
    sectionType: "quality-points",
    title: "Built Around Engineering, Safety, and Long-Term Performance",
    subtitle: "Trust & Quality",
    body: "Engineering-first design, proper component selection, compliance-minded installation, roof protection, documentation, and long-term asset care.",
    sortOrder: 90
  });
  await replaceItems(quality.id, [
    ["Engineering-first design", "CircuitBoard"],
    ["Proper component selection", "Boxes"],
    ["Compliance-minded installation", "ShieldCheck"],
    ["Monitoring and after-sales support", "MonitorCheck"],
    ["Roof protection and waterproofing care", "Droplets"],
    ["Documentation and reporting", "FileText"],
    ["Long-term asset care through Alektra divisions", "Sparkles"]
  ].map(([title, icon], index) => ({ title, icon, sortOrder: index })));

  await upsertSection(page.id, {
    sectionKey: "proposal-form",
    sectionType: "request-form-intro",
    title: "Request a Solar EPC Proposal",
    subtitle: "Proposal Request",
    body: "Tell us about your facility and energy requirement. Our engineering team will review your information and contact you with the next steps.",
    sortOrder: 95
  });

  const faq = await upsertSection(page.id, {
    sectionKey: "faq",
    sectionType: "faq",
    title: "Solar EPC Questions",
    subtitle: "EPC FAQ",
    body: "Clear answers for industrial and commercial clients evaluating solar EPC, hybrid energy systems, net metering, monitoring, and after-sales support.",
    sortOrder: 98
  });
  await replaceItems(faq.id, [
    ["What type of solar projects does Alektra Renewable handle?", "Alektra Renewable focuses on commercial, industrial, institutional, rooftop, and selected larger solar energy projects where structured engineering and long-term support are important."],
    ["Do you work with industrial and commercial rooftop solar systems?", "Yes. Industrial and commercial rooftop systems are a core part of our EPC work, including design, procurement, installation, commissioning, monitoring, and after-sales support."],
    ["Can you design hybrid solar and energy storage systems?", "Yes. We can evaluate hybrid solar and energy storage readiness based on load profile, backup requirement, site condition, budget, and operating objective."],
    ["Do you support net metering applications?", "We can support technical documentation and coordination for eligible net metering projects, subject to applicable rules, utility requirements, and site feasibility."],
    ["What information is needed for a solar proposal?", "Useful information includes facility location, roof or land area, electricity bills or consumption data, transformer and load details, desired system type, and any site constraints."],
    ["How do you protect the roof during installation?", "Our installation planning considers roof integrity, drainage, waterproofing, access, and suitable mounting practices. Where anchoring is required, proper waterproofing procedures are followed."],
    ["Do you provide monitoring and after-sales support?", "Yes. We support monitoring, performance follow-up, issue coordination, and long-term asset care through EPC support and Alektra divisions such as Thermal, Sparkle, and Mapping."],
    ["What brands of inverters and panels do you work with?", "Brand selection depends on project requirements, availability, warranty, technical compatibility, service support, and client preference. We prioritize reliable components suited to the project context."],
    ["Do you provide thermal inspection and cleaning support?", "Eligible clients may receive support from Alektra Thermal for aerial thermal inspection and Alektra Sparkle for professional solar panel cleaning, subject to project scope and terms."],
    ["How long does a typical EPC project take?", "Timeline depends on system size, site readiness, design approval, procurement, utility coordination, weather, and access conditions. Our team provides a project-specific schedule after review."]
  ].map(([title, body], index) => ({ title, body, sortOrder: index })));

  await upsertSection(page.id, {
    sectionKey: "final-cta",
    sectionType: "final-cta",
    title: "Ready to Build a Smarter Solar Energy System?",
    subtitle: "Start With Alektra",
    body: "Tell us about your facility, load profile, roof condition, and energy goals. Our team will help you evaluate the right solar solution for your business.",
    sortOrder: 100,
    settingsJson: { primaryCtaText: "Request a Proposal", primaryCtaLink: "/#epc-proposal-form" }
  });
}

async function seedThermalPage() {
  const page = await upsertPage(
    PageKey.thermal,
    "Alektra Thermal",
    "thermal",
    "Alektra Thermal | Deploying Proprietary Artificial Intelligence Software for Aerial Thermal Inspection of Solar PV Plants",
    "Artificaly Intelligent Drone-based infrared and RGB inspection for rooftop and ground-mounted solar PV plants."
  );

  const hero = await upsertSection(page.id, {
    sectionKey: "hero",
    sectionType: "hero",
    title: "Alektra Thermal",
    subtitle: "AI-Assisted Drone Based Anomaly Detection and Digital Twin Mapping",
    body: "Alektra Thermal combines high-resolution drone-based infrared imaging, RGB visual inspection, AI-powered analytics, and digital twin asset mapping to identify hidden faults across solar PV plants. From hot spots and bypass diode activation to string issues, soiling, shading, cracked modules, and underperforming zones, our inspection process helps asset owners, EPCs, and O&M teams detect problems faster, prioritize maintenance, and protect long-term energy generation. Each inspection can also create a digital twin reference of the client?s solar asset, enabling future comparison, lifecycle tracking, warranty support, and data-driven maintenance planning.",
    sortOrder: 10,
    settingsJson: {
      kicker: "AI-Powered Aerial Thermal Intelligence & Digital Twin Asset Mapping",
      primaryCtaText: "Request an Inspection",
      primaryCtaLink: "#request",
      secondaryCtaText: "Explore Detected Anomalies",
      secondaryCtaLink: "#anomalies",
      minimumNote: "Minimum thermal inspection site size:",
      minimumValue: "50 kWp",
      posterImage: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1800&q=80"
    }
  });
  await replaceItems(hero.id, [{ title: "Thermal hero media", videoPath: "/videos/thermal-drone.mp4", sortOrder: 0 }]);

  await upsertSection(page.id, {
    sectionKey: "why-it-matters",
    sectionType: "intro",
    title: "See performance losses that remain hidden from the ground.",
    subtitle: "Why it matters",
    body: "Aerial inspection combines calibrated flight planning, infrared imagery and high-resolution RGB evidence to assess large PV sites quickly and consistently.\n\nThe result is a clearer maintenance priority list, fewer unnecessary truck rolls and stronger evidence for commissioning, warranty and due-diligence decisions.",
    sortOrder: 20
  });

  const anomalies = await upsertSection(page.id, {
    sectionKey: "anomalies",
    sectionType: "anomaly-grid",
    title: "Anomalies We Detect",
    subtitle: "Inspection analytics",
    body: "Our aerial thermal inspection identifies module, string, electrical, environmental and site-level anomalies that reduce solar plant performance.",
    sortOrder: 30
  });
  await replaceItems(anomalies.id, thermalAnomalies.map(([title, body, severity, icon], index) => ({
    title,
    body,
    badge: severity,
    icon,
    sortOrder: index,
    settingsJson: {
      category: index <= 2 ? "Module" : index <= 5 ? "Electrical" : index <= 7 ? "Module" : index <= 10 ? "Environmental" : "Site",
      inspectionValue: "Thermal and RGB evidence helps the O&M team confirm priority and plan targeted field action."
    }
  })));

  const packages = await upsertSection(page.id, {
    sectionKey: "packages",
    sectionType: "package-cards",
    title: "Choose the detail level your asset requires",
    subtitle: "Inspection packages",
    body: "Both inspection levels combine aerial infrared and RGB capture with classified findings and maintenance priorities.",
    sortOrder: 40
  });
  await replaceItems(packages.id, [
    {
      title: "Standard Level Inspection",
      badge: "Standard",
      body: standardPoints.join("\n"),
      linkText: "Request an Inspection",
      linkUrl: "#request",
      sortOrder: 0,
      settingsJson: {
        tags: ["O&M inspection", "Commissioning", "EPC handover", "Preventive maintenance", "Portfolio benchmarking"],
        featured: false
      }
    },
    {
      title: "Comprehensive Level Inspection",
      badge: "Comprehensive",
      body: comprehensivePoints.join("\n"),
      linkText: "Request an Inspection",
      linkUrl: "#request",
      sortOrder: 1,
      settingsJson: {
        tags: ["Warranty claim", "Due diligence", "Bank/owner inspection", "Commissioning", "Underperformance diagnosis", "Detailed asset baseline"],
        featured: true
      }
    }
  ]);

  const workflow = await upsertSection(page.id, {
    sectionKey: "workflow",
    sectionType: "workflow",
    title: "From request to actionable maintenance priorities",
    subtitle: "Inspection workflow",
    body: "A structured process keeps flight capture, analysis and reporting consistent.",
    sortOrder: 50
  });
  await replaceItems(workflow.id, [
    ["Submit request", "Share site, module and capacity details.", "ClipboardCheck"],
    ["Flight planning", "Define safe routes, altitude and data resolution.", "Plane"],
    ["IR + RGB capture", "Collect thermal and color imagery across the asset.", "Crosshair"],
    ["Anomaly classification", "Review patterns by type, severity and location.", "ScanLine"],
    ["Digital Twin Creation + Report generation", "Our Proprietory Artifical Intelligent Software creates a Digital Twin and issues PDF record with evidence and findings.", "FileSearch"],
    ["Maintenance support", "Prioritize field checks and corrective work.", "Check"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index, badge: String(index + 1) })));

  await upsertSection(page.id, {
    sectionKey: "request-form",
    sectionType: "form-intro",
    title: "Request a Thermal Inspection",
    subtitle: "Inspection request",
    body: "Tell us about the plant. PV capacity is calculated automatically from the module rows you provide.",
    sortOrder: 60,
    settingsJson: {
      minimumNote: "Minimum thermal inspection site size: 50 kWp",
      paymentNote: "Payment is not required during request submission.",
      nextStepsNote: "Our team will review your request and contact you shortly."
    }
  });

  const faq = await upsertSection(page.id, {
    sectionKey: "faq",
    sectionType: "faq",
    title: "Thermal inspection questions",
    subtitle: "FAQ",
    body: "Essential details before requesting an inspection.",
    sortOrder: 70
  });
  await replaceItems(faq.id, [
    ["What is the minimum site size?", "Minimum thermal inspection site size is 50 kWp."],
    ["What is the difference between Standard and Comprehensive inspection?", "Standard balances speed and useful sub-module detail for routine O&M. Comprehensive flies lower and slower for higher spatial detail, absolute temperature accuracy and warranty-grade investigation."],
    ["Do you provide IEC-aligned inspection?", "The Comprehensive level is designed for detailed, IEC-aligned aerial infrared inspection requirements."],
    ["What information do you need before inspection?", "Module model and quantity, DC and AC capacity, site location, access details and the inspection objective."],
    ["Do you provide a PDF report?", "Yes. Requests receive a PDF confirmation, and completed inspections are documented with classified findings and supporting imagery."],
    ["Can you inspect rooftop and ground-mounted PV plants?", "Yes. Flight planning is adapted to rooftop, industrial and ground-mounted plant conditions."],
    ["Is payment required during request submission?", "Not by default. Payment may be requested later if enabled by admin."]
  ].map(([title, body], index) => ({ title, body, sortOrder: index })));
}

async function seedSparklePage() {
  const page = await upsertPage(
    PageKey.sparkle,
    "Alektra Sparkle",
    "sparkle",
    "Alektra Sparkle | Professional Solar Panel Cleaning for Industrial & Commercial Rooftop Systems",
    "Premium solar panel cleaning service for industrial and commercial rooftop PV systems in Bangladesh."
  );

  const hero = await upsertSection(page.id, {
    sectionKey: "hero",
    sectionType: "hero",
    title: "Alektra Sparkle",
    subtitle: "Professional Solar Panel Cleaning for Industrial & Commercial Rooftop Systems",
    body: "Alektra Sparkle delivers specialized solar cleaning solutions designed to restore panel performance, reduce soiling losses, and support long-term asset health for industrial and commercial rooftop solar systems. We combine safe cleaning practices, proper equipment, and performance-focused service planning to help clients protect energy yield and maintain system efficiency.",
    sortOrder: 10,
    settingsJson: {
      kicker: "Industrial Solar Cleaning Excellence",
      primaryCtaText: "Request Service",
      primaryCtaLink: "#request",
      secondaryCtaText: "Why Cleaning Matters",
      secondaryCtaLink: "#why-cleaning",
      minimumNote: "Minimum Sparkle service request size:",
      minimumValue: "200 kWp",
      posterImage: ""
    }
  });
  await replaceItems(hero.id, [{ title: "Sparkle hero media", videoPath: "/uploads/hero/sparkle/sparkle-hero-video.mp4", sortOrder: 0 }]);
  await prisma.pageSectionItem.updateMany({
    where: { sectionId: hero.id, title: "Sparkle hero media" },
    data: { videoPath: "/uploads/hero/sparkle/sparkle-hero-video.mp4" }
  });

  const existingHeroMedia = await prisma.heroMedia.findFirst({
    where: { pageKey: PageKey.sparkle, filePath: "/uploads/hero/sparkle/sparkle-hero-video.mp4" }
  });
  if (!existingHeroMedia) {
    await prisma.heroMedia.create({
      data: {
        pageKey: PageKey.sparkle,
        title: "Sparkle rooftop cleaning hero video",
        mediaType: "video",
        url: "/uploads/hero/sparkle/sparkle-hero-video.mp4",
        filePath: "/uploads/hero/sparkle/sparkle-hero-video.mp4",
        alt: "Alektra Sparkle solar panel cleaning service",
        altText: "Alektra Sparkle solar panel cleaning service",
        sortOrder: 0,
        isPrimary: true,
        isPublished: true,
        status: PublishStatus.PUBLISHED
      }
    });
  }

  const why = await upsertSection(page.id, {
    sectionKey: "why-cleaning",
    sectionType: "cards",
    title: "Why Cleaning Solar Panels Is Absolutely Necessary",
    subtitle: "Yield protection",
    body: "Industrial and commercial rooftops in Bangladesh can accumulate dust, bird droppings, pollution residue and grime quickly. Routine cleaning helps restore generation, supports maintenance planning and keeps asset performance easier to monitor.",
    sortOrder: 20
  });
  await replaceItems(why.id, [
    ["Soiling reduces output", "Dust and residue block irradiance and reduce generation across the array.", "Gauge"],
    ["Uneven dirt creates risk", "Bird droppings and heavy deposits can create mismatch, local heating and monitoring anomalies.", "TriangleAlert"],
    ["Cleaner assets are easier to manage", "Routine cleaning improves visual condition, generation consistency and O&M planning.", "ShieldCheck"],
    ["Rooftop plants need attention", "Industrial and commercial roofs can experience rapid contaminant buildup from nearby activity.", "Factory"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const data = await upsertSection(page.id, {
    sectionKey: "visual-data",
    sectionType: "comparison",
    title: "Clean panels convert more of the available sunlight.",
    subtitle: "Performance view",
    body: "This visual comparison explains the practical effect: soiled modules lose useful output, while clean modules support stronger energy yield and clearer performance tracking.",
    sortOrder: 30
  });
  await replaceItems(data.id, [
    { title: "Clean output baseline", body: "A clean array gives monitoring teams a more reliable performance reference.", badge: "100%", sortOrder: 0, settingsJson: { bar: 100 } },
    { title: "Light soiling", body: "Fine dust and rooftop residue can begin reducing production before the loss is obvious.", badge: "92%", sortOrder: 1, settingsJson: { bar: 92 } },
    { title: "Heavy soiling", body: "Sticky grime, bird droppings and deposits can create larger localized and system-level losses.", badge: "78%", sortOrder: 2, settingsJson: { bar: 78 } }
  ]);

  const myth = await upsertSection(page.id, {
    sectionKey: "rain-myth",
    sectionType: "myth",
    title: "Myth: Do Rains Clean Solar Panels?",
    subtitle: "Rain is not performance-grade cleaning",
    body: "Rain may remove some loose surface dust, but it usually does not properly clean solar panels. Sticky dust, grime, bird droppings, industrial residue and edge deposits often remain, so rainwater alone cannot guarantee uniform or performance-grade cleaning.",
    sortOrder: 40,
    settingsJson: {
      mythTitle: "Rain washes everything away.",
      realityTitle: "Professional cleaning is still necessary."
    }
  });
  await replaceItems(myth.id, [
    { title: "What rain can do", body: "It can move some loose dust from exposed glass surfaces.", sortOrder: 0 },
    { title: "What rain leaves behind", body: "Sticky grime, residue, droppings and edge deposits often remain after rainfall.", sortOrder: 1 },
    { title: "What Sparkle provides", body: "A planned, module-safe process designed for uniform cleaning across operating rooftop arrays.", sortOrder: 2 }
  ]);

  const services = await upsertSection(page.id, {
    sectionKey: "services",
    sectionType: "service-cards",
    title: "Services We Offer",
    subtitle: "Cleaning capability",
    body: "Alektra Sparkle focuses on practical cleaning services for large rooftop PV assets where uptime, safety and repeatable process matter.",
    sortOrder: 50
  });
  await replaceItems(services.id, [
    ["Industrial & commercial rooftop cleaning", "Panel cleaning for large operating rooftop arrays.", "Building2"],
    ["Routine performance cleaning", "Scheduled cleaning cycles that support consistent generation.", "CalendarCheck"],
    ["One-time deep cleaning", "Focused cleaning for visibly soiled arrays or post-construction residue.", "Droplets"],
    ["Equipment-assisted cleaning", "Manual and equipment-assisted cleaning using module-safe handling practices.", "Wrench"],
    ["Before/after documentation", "Optional visual records to support O&M documentation.", "ClipboardCheck"],
    ["O&M coordination", "Cleaning plans aligned with operating plants and site access windows.", "Users"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const workflow = await upsertSection(page.id, {
    sectionKey: "workflow",
    sectionType: "workflow",
    title: "A clean, controlled service workflow",
    subtitle: "Sparkle cleaning workflow",
    body: "From request review to final completion, the process is structured for industrial and commercial rooftop systems.",
    sortOrder: 60
  });
  await replaceItems(workflow.id, [
    ["Service request received", "Share module, capacity, location and service requirement details.", "ClipboardCheck"],
    ["Requirement review", "Our team reviews size, rooftop condition, access and service type.", "FileSearch"],
    ["Cleaning plan and scheduling", "We coordinate timing, safety preparation and cleaning scope.", "CalendarCheck"],
    ["Mobilization and safety preparation", "Equipment and team readiness are aligned with site conditions.", "ShieldCheck"],
    ["Cleaning execution", "Solar panels are cleaned using a safe, non-abrasive approach.", "Droplets"],
    ["Final review", "Service completion is reviewed with before/after observations where applicable.", "Check"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index, badge: String(index + 1) })));

  await upsertSection(page.id, {
    sectionKey: "request-form",
    sectionType: "form-intro",
    title: "Request Sparkle Service",
    subtitle: "Service request",
    body: "Tell us about your rooftop solar plant. PV capacity is calculated automatically from the module rows you provide.",
    sortOrder: 70,
    settingsJson: {
      minimumNote: "Minimum Sparkle service request size: 200 kWp",
      nextStepsNote: "Our team will review your request and contact you shortly."
    }
  });

  const faq = await upsertSection(page.id, {
    sectionKey: "faq",
    sectionType: "faq",
    title: "Sparkle service questions",
    subtitle: "FAQ",
    body: "Useful details before requesting solar panel cleaning service.",
    sortOrder: 80
  });
  await replaceItems(faq.id, [
    ["Why is solar panel cleaning important?", "Cleaning helps reduce soiling losses, improves visual condition and supports more reliable performance monitoring."],
    ["Does rain clean solar panels effectively?", "Rain may remove loose dust, but sticky dust, grime, bird droppings, industrial residue and edge deposits often remain."],
    ["What type of systems do you serve?", "Alektra Sparkle is focused on industrial and commercial rooftop solar PV systems."],
    ["What is the minimum system size for Sparkle service?", "Minimum Sparkle service request size is 200 kWp."],
    ["Do you provide one-time and scheduled cleaning?", "Yes. Requests can be made for routine cleaning, one-time deep cleaning and scheduled maintenance cleaning."],
    ["Is the cleaning process safe for panels?", "The service philosophy is soft-contact, non-abrasive and module-safe handling by trained personnel."],
    ["Do you serve industrial and commercial rooftop systems only?", "That is the primary service focus for Sparkle at this stage."],
    ["Can you coordinate with maintenance teams?", "Yes. Cleaning plans can be coordinated with site access, safety and O&M schedules."]
  ].map(([title, body], index) => ({ title, body, sortOrder: index })));
}

async function seedMappingPage() {
  const page = await upsertPage(
    PageKey.mapping,
    "Alektra Mapping",
    "mapping",
    "Alektra Mapping | Drone Mapping, Photogrammetry, LiDAR and 3D Digital Twin Documentation",
    "Advanced aerial mapping, 3D visualization, photogrammetry, LiDAR, digital twin and geospatial documentation services."
  );

  const hero = await upsertSection(page.id, {
    sectionKey: "hero",
    sectionType: "hero",
    title: "Alektra Mapping",
    subtitle: "Advanced Photogrammetry & LiDAR Mapping for Assets, Heritage, Infrastructure, and Power Corridors",
    body: "Alektra Mapping transforms real-world sites, structures, corridors, and assets into accurate digital intelligence. Using drone-based data acquisition, AI-assisted processing, advanced stitching software, and our proprietary mapping workflow, we deliver high-resolution orthomosaics, 3D models, digital twins, asset maps, inspection datasets, and geospatial documentation for smarter engineering, maintenance, preservation, and decision-making.",
    sortOrder: 10,
    settingsJson: {
      kicker: "AI-Powered Drone Mapping & 3D Geospatial Intelligence",
      primaryCtaText: "Request Mapping Service",
      primaryCtaLink: "#request",
      secondaryCtaText: "Explore Mapping Methods",
      secondaryCtaLink: "#methods",
      signature: "Whatever it is — we map it with precision.",
      posterImage: ""
    }
  });
  await replaceItems(hero.id, [{ title: "Mapping hero media", videoPath: "/uploads/hero/mapping/mapping-hero-video.mp4", sortOrder: 0 }]);

  const existingHeroMedia = await prisma.heroMedia.findFirst({
    where: { pageKey: PageKey.mapping, filePath: "/uploads/hero/mapping/mapping-hero-video.mp4" }
  });
  if (!existingHeroMedia) {
    await prisma.heroMedia.create({
      data: {
        pageKey: PageKey.mapping,
        title: "Mapping drone geospatial hero video",
        mediaType: "video",
        url: "/uploads/hero/mapping/mapping-hero-video.mp4",
        filePath: "/uploads/hero/mapping/mapping-hero-video.mp4",
        alt: "Alektra Mapping drone mapping and 3D visualization",
        altText: "Alektra Mapping drone mapping and 3D visualization",
        sortOrder: 0,
        isPrimary: true,
        isPublished: true,
        status: PublishStatus.PUBLISHED
      }
    });
  }

  const positioning = await upsertSection(page.id, {
    sectionKey: "positioning",
    sectionType: "cards",
    title: "Spatial intelligence for assets, infrastructure, corridors, and sites.",
    subtitle: "Professional positioning",
    body: "Alektra Mapping is built for organizations that need accurate, visual, and actionable spatial intelligence. From industrial rooftops, substations, power lines, and solar plants to heritage structures, construction sites, terrain, and infrastructure corridors, we capture, process, and transform complex physical environments into reliable digital datasets.",
    sortOrder: 20
  });
  await replaceItems(positioning.id, [
    ["Asset mapping", "Industrial, solar, utility and infrastructure assets documented with geospatial context.", "MapPinned"],
    ["Digital twin creation", "A reliable visual baseline for future comparison, maintenance and lifecycle tracking.", "Boxes"],
    ["Inspection-ready datasets", "Geotagged imagery, maps and visual records that support engineering decisions.", "FileSearch"],
    ["Corridor intelligence", "Power line and utility corridor mapping for visualization, clearance and documentation.", "Route"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const ai = await upsertSection(page.id, {
    sectionKey: "ai-workflow",
    sectionType: "feature-panel",
    title: "AI-Assisted Processing & Proprietary Mapping Workflow",
    subtitle: "Geospatial processing",
    body: "We use industry-leading AI-assisted mapping, stitching, reconstruction, and geospatial processing tools to convert raw drone imagery, LiDAR scans, and field data into accurate, usable deliverables. Our internal proprietary workflow helps improve data organization, asset tagging, reporting consistency, and project-specific visualization for engineering and inspection teams.",
    sortOrder: 30
  });
  await replaceItems(ai.id, [
    ["AI-assisted stitching", "Advanced stitching and reconstruction workflows for high-resolution mapping outputs.", "Sparkles"],
    ["Asset tagging", "Organized asset references, visual evidence and project-specific tags.", "Binary"],
    ["Data validation", "Structured quality checks before reporting and delivery packaging.", "Check"],
    ["Reporting workflow", "Consistent outputs for engineering, inspection and management teams.", "Database"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const methods = await upsertSection(page.id, {
    sectionKey: "methods",
    sectionType: "comparison-cards",
    title: "Choose the Right Mapping Method",
    subtitle: "Photogrammetry vs LiDAR",
    body: "Alektra Mapping offers both photogrammetry-based and LiDAR-based mapping depending on project objective, accuracy requirement, surface condition, budget, and deliverable type.",
    sortOrder: 40
  });
  await replaceItems(methods.id, [
    {
      title: "Photogrammetry-Based Mapping",
      badge: "Photogrammetry",
      body: "Photogrammetry uses overlapping high-resolution images captured from drones or cameras and processes them through specialized software to create orthomosaics, textured 3D models, 3D mesh, and visual site documentation.\n\n- Best for color-rich 3D models, orthomosaic maps, rooftop and site visualization, construction progress, heritage documentation, solar PV and industrial asset visual inspection.\n- Benefits include rich color and texture, cost-effective documentation, strong presentation value, and easier visual interpretation.\n- Limitations include dependency on lighting, image quality, shadows, reflective surfaces, weather, and featureless surfaces.",
      sortOrder: 0
    },
    {
      title: "LiDAR-Based Mapping",
      badge: "LiDAR",
      body: "LiDAR uses laser pulses to measure distances and generate dense 3D point clouds and elevation datasets. It is useful where geometry, elevation, vegetation penetration, and high-precision spatial measurement are more important than visual texture alone.\n\n- Best for power line and corridor mapping, terrain/elevation mapping, vegetation and clearance analysis, complex infrastructure, and utility corridors.\n- Benefits include strong geometric accuracy, better low-light operation, dense point clouds, and engineering-grade spatial analysis where required.\n- Limitations include higher cost, specialized equipment, and additional processing for color or texture.",
      sortOrder: 1
    }
  ]);

  const matrix = await upsertSection(page.id, {
    sectionKey: "comparison-matrix",
    sectionType: "matrix",
    title: "Mapping method comparison",
    subtitle: "Visual matrix",
    body: "A clear technical comparison helps select the right data capture method for the objective.",
    sortOrder: 50
  });
  await replaceItems(matrix.id, [
    ["Data capture method", "Overlapping high-resolution imagery", "Laser pulse distance measurement"],
    ["Output type", "Orthomosaic, textured 3D mesh, visual model", "Dense point cloud, elevation model, geometry dataset"],
    ["Visual texture", "Excellent color and surface texture", "Requires additional processing or colorization"],
    ["Elevation/geometry strength", "Good for many visual mapping projects", "Strong for geometry and elevation analysis"],
    ["Vegetation penetration", "Limited", "Better than image-only capture"],
    ["Lighting dependency", "Higher dependency on lighting and shadows", "Lower dependency on visible light"],
    ["Cost level", "Generally more cost-effective", "Higher equipment and processing cost"],
    ["Best use case", "Visual documentation and presentation", "Corridors, terrain, clearance and engineering analysis"]
  ].map(([title, photogrammetry, lidar], index) => ({ title, sortOrder: index, settingsJson: { photogrammetry, lidar } })));

  const services = await upsertSection(page.id, {
    sectionKey: "services",
    sectionType: "service-cards",
    title: "Mapping Services We Offer",
    subtitle: "Capabilities",
    body: "Professional drone mapping and geospatial documentation services for renewable-energy, industrial, utility, heritage and construction environments.",
    sortOrder: 60
  });
  await replaceItems(services.id, [
    ["Drone Photogrammetry Mapping", "High-resolution drone imagery processed into maps, 3D models and visual site documentation.", "Camera"],
    ["LiDAR Mapping & Point Cloud Capture", "Dense point cloud and elevation datasets for geometry-focused mapping needs.", "ScanLine"],
    ["Orthomosaic Map Generation", "Georeferenced visual map outputs for planning, documentation and inspection.", "Map"],
    ["3D Mesh & Digital Twin Modeling", "Digital twin references and textured 3D models for asset visualization.", "Boxes"],
    ["Industrial Asset Mapping", "Factory, rooftop, substation and industrial site asset documentation.", "Building2"],
    ["Solar PV Plant Mapping", "Solar plant layouts, rooftop references and O&M-ready visual documentation.", "Zap"],
    ["Power Line & Corridor Inspection Mapping", "Utility corridor and line mapping for visualization and clearance review.", "RadioTower"],
    ["Heritage & Architectural Documentation", "Visual preservation records and 3D documentation for structures.", "Landmark"],
    ["Construction Progress Mapping", "Recurring mapping for progress monitoring and comparison.", "Milestone"],
    ["Rooftop & Terrain Mapping", "Roof, land, surface and terrain mapping for planning and design support.", "Layers3"],
    ["Geotagged Visual Inspection Documentation", "Inspection datasets with spatial context and traceable imagery.", "FileSearch"],
    ["AI-Assisted Asset Tagging and Reporting", "Structured project records, tagged assets and reporting consistency.", "CircuitBoard"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const deliverables = await upsertSection(page.id, {
    sectionKey: "deliverables",
    sectionType: "deliverables",
    title: "What You Can Receive",
    subtitle: "Deliverables",
    body: "Final deliverables depend on selected mapping method, site condition, required accuracy, survey control, and project scope.",
    sortOrder: 70
  });
  await replaceItems(deliverables.id, ["Orthomosaic map", "3D textured model", "3D mesh", "Point cloud", "Digital twin reference", "Contour/elevation model if applicable", "Geotagged image dataset", "Asset map", "Inspection-ready report", "Corridor visualization", "Before/after or progress comparison dataset", "Web-viewable model link if implemented later", "PDF report and downloadable dataset package"].map((title, index) => ({ title, sortOrder: index })));

  const useCases = await upsertSection(page.id, {
    sectionKey: "use-cases",
    sectionType: "use-cases",
    title: "Where Mapping Creates Value",
    subtitle: "Use cases",
    body: "Alektra Mapping supports engineering, inspection, preservation, operations and management teams with visual geospatial intelligence.",
    sortOrder: 80
  });
  await replaceItems(useCases.id, [
    ["Solar PV plant mapping", "Layout, asset and visual documentation for solar plants.", "Zap"],
    ["Industrial rooftop mapping", "Rooftop geometry and asset visualization for commercial sites.", "Building2"],
    ["Power line and utility corridor mapping", "Corridor references and visual inspection datasets.", "RadioTower"],
    ["Substation and electrical asset documentation", "Utility asset records with spatial and visual context.", "CircuitBoard"],
    ["Heritage structure preservation", "3D documentation for preservation and future reference.", "Landmark"],
    ["Construction progress monitoring", "Repeatable site records for progress comparison.", "Milestone"],
    ["Factory/warehouse asset mapping", "Industrial site inventory and spatial documentation.", "Boxes"],
    ["Terrain and land development mapping", "Terrain, surface and planning references.", "Layers3"],
    ["Disaster or damage documentation", "Visual condition records after events or incidents.", "FileSearch"],
    ["Digital twin baseline creation", "Reference datasets for future lifecycle comparisons.", "SquareStack"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index })));

  const workflow = await upsertSection(page.id, {
    sectionKey: "workflow",
    sectionType: "workflow",
    title: "From site request to mapping deliverables",
    subtitle: "Mapping workflow",
    body: "A structured workflow keeps capture, processing, validation and reporting aligned with project objectives.",
    sortOrder: 90
  });
  await replaceItems(workflow.id, [
    ["Service Request", "Share the site, objective and desired deliverables.", "FileSearch"],
    ["Project Scope Review", "Review area, method, access, safety and output needs.", "Search"],
    ["Method Selection", "Select photogrammetry, LiDAR or hybrid capture.", "Crosshair"],
    ["Flight Planning & Safety Review", "Plan routes, altitude, overlap and site safety requirements.", "Plane"],
    ["Drone Data Acquisition", "Capture imagery, LiDAR scans or hybrid datasets.", "Camera"],
    ["AI-Assisted Processing & Stitching", "Process imagery, scans and reconstruction data.", "Sparkles"],
    ["Quality Check and Data Validation", "Review completeness, consistency and project fit.", "Check"],
    ["Deliverables & Reporting", "Package maps, models, reports and datasets.", "FileArchive"],
    ["Optional Future Comparison", "Update digital twin references over time.", "SquareStack"]
  ].map(([title, body, icon], index) => ({ title, body, icon, sortOrder: index, badge: String(index + 1) })));

  await upsertSection(page.id, {
    sectionKey: "request-form",
    sectionType: "form-intro",
    title: "Request Mapping Service",
    subtitle: "Service request",
    body: "Tell us what needs to be mapped. Our team will review your objective, site type, preferred method and deliverables before recommending the right mapping approach.",
    sortOrder: 100
  });

  const faq = await upsertSection(page.id, {
    sectionKey: "faq",
    sectionType: "faq",
    title: "Mapping service questions",
    subtitle: "FAQ",
    body: "Useful details before requesting drone mapping, LiDAR or digital twin documentation.",
    sortOrder: 110
  });
  await replaceItems(faq.id, [
    ["What is drone mapping?", "Drone mapping captures aerial imagery or LiDAR data and processes it into maps, models, point clouds, datasets and visual documentation."],
    ["What is the difference between photogrammetry and LiDAR?", "Photogrammetry builds maps and 3D models from overlapping images. LiDAR uses laser measurements to create dense point clouds and stronger geometry/elevation datasets."],
    ["Which mapping method should I choose?", "It depends on the project objective, accuracy requirement, site condition, budget and deliverables. Alektra can recommend photogrammetry, LiDAR or a hybrid approach."],
    ["Can you map solar PV plants and rooftops?", "Yes. Solar PV plants, industrial rooftops and commercial rooftops are key mapping applications."],
    ["Can you map power lines or utility corridors?", "Yes. Corridor and utility mapping can support visualization, documentation and clearance-focused review."],
    ["Can you create 3D models or digital twins?", "Yes. Deliverables can include textured 3D models, digital twin references, asset maps and inspection-ready visual datasets."],
    ["Do you provide mapping for heritage or architectural documentation?", "Yes. Photogrammetry is especially useful for heritage, architectural and structure documentation where visual texture matters."],
    ["What deliverables will I receive?", "Deliverables depend on scope and may include orthomosaic maps, 3D models, point clouds, reports, digital twin references and downloadable datasets."],
    ["Is LiDAR always necessary?", "No. Photogrammetry is often sufficient for visual mapping. LiDAR is selected when geometry, elevation or vegetation-related requirements justify it."],
    ["Do you provide custom mapping reports?", "Yes. Reporting can be tailored to project objective, inspection use, asset documentation or management needs."]
  ].map(([title, body], index) => ({ title, body, sortOrder: index })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

