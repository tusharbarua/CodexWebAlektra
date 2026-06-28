import { PageKey, Prisma, PrismaClient, PublishStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { comprehensivePoints, standardPoints, thermalAnomalies } from "../src/data/thermal";

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

  const permissionModules = ["Dashboard", "Pages", "Products", "Categories", "Orders", "Projects", "Resources", "Hero Media", "Footer Settings", "SEO", "Integrations", "Thermal Inspections", "Contact Submissions", "Users", "Roles", "Site Settings"];
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

async function seedSubdivisionPages() {
  await seedThermalPage();
  await seedSimpleSubdivision(PageKey.sparkle, "Alektra Sparkle", "sparkle", "Solar panel cleaning service", "Panel cleaning and surface care for operating solar assets.", "Alektra Sparkle helps solar owners maintain cleaner modules, reduce soiling losses and support consistent generation through professional cleaning workflows.");
  await seedSimpleSubdivision(PageKey.mapping, "Alektra Mapping", "mapping", "Photogrammetry and digital mapping", "Aerial survey, mapping and asset documentation for renewable-energy sites.", "Alektra Mapping supports site planning, digital mapping, aerial survey and documentation for solar and infrastructure projects.");
  await seedSimpleSubdivision(PageKey.epc, "Alektra EPC", "epc", "Solar EPC in Bangladesh", "Rooftop, industrial and commercial solar EPC.", "Alektra EPC designs, engineers, procures, installs and commissions solar plants with net metering and monitoring support.");
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

async function seedSimpleSubdivision(pageKey: PageKey, title: string, slug: string, metaTitle: string, metaDescription: string, body: string) {
  const page = await upsertPage(pageKey, title, slug, metaTitle, metaDescription);
  const hero = await upsertSection(page.id, {
    sectionKey: "hero",
    sectionType: "simple-hero",
    title,
    subtitle: metaTitle,
    body,
    sortOrder: 10,
    settingsJson: { primaryCtaText: "Contact Alektra", primaryCtaLink: "/#contact" }
  });
  await replaceItems(hero.id, []);
  await upsertSection(page.id, {
    sectionKey: "overview",
    sectionType: "simple-content",
    title: "Overview",
    subtitle: "Editable subdivision content",
    body,
    sortOrder: 20
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

