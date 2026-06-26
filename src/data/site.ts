import { officialLogoDataUrl } from "@/data/official-logo";

export const brand = {
  name: "Alektra Renewable",
  domain: "www.alektraepc.com",
  logo: officialLogoDataUrl,
  email: "contact@alektraepc.com",
  phone: "+880 1735954 844",
  address: "Dhaka, Bangladesh"
};

export const heroImages = [
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=2200&q=85"
];

export const impact = {
  plantsInOperation: 13,
  totalInstalledCapacityKw: 1240,
  kwhGenerated: 289569,
  equivalentTreesPlanted: 37475,
  co2OffsetTons: 198,
  longHaulFlightsAvoided: 4172
};

export const subdivisions = [
  {
    key: "epc",
    name: "Alektra EPC",
    label: "Solar EPC",
    headline: "End-to-end rooftop, industrial and commercial solar delivery.",
    body:
      "Alektra EPC handles feasibility, design, engineering, procurement, installation, commissioning, net metering coordination and monitoring for dependable solar plants in Bangladesh.",
    services: ["Design and engineering", "Procurement", "Installation", "Commissioning", "Net metering", "Monitoring"]
  },
  {
    key: "thermal",
    name: "Alektra Thermal",
    label: "Aerial Inspection",
    headline: "Thermal intelligence for operating solar plants.",
    body:
      "Drone-based aerial thermal inspection helps identify hotspots, damaged modules, string issues and maintenance priorities before production losses compound.",
    services: ["Aerial thermal scan", "Hotspot detection", "Fault reports", "Maintenance planning"]
  },
  {
    key: "sparkle",
    name: "Alektra Sparkle",
    label: "Panel Cleaning",
    headline: "Solar panel cleaning that protects yield.",
    body:
      "Alektra Sparkle keeps modules clean, efficient and inspection-ready with safe cleaning workflows designed for rooftop and industrial systems.",
    services: ["Scheduled cleaning", "Soiling removal", "Water-safe process", "Yield recovery checks"]
  },
  {
    key: "mapping",
    name: "Alektra Mapping",
    label: "Digital Mapping",
    headline: "Photogrammetry, aerial survey and digital mapping services.",
    body:
      "Alektra Mapping supports site planning, asset documentation and survey workflows with aerial imagery, photogrammetry and digital mapping outputs.",
    services: ["Photogrammetry", "Aerial survey", "Digital mapping", "Site documentation"]
  }
];

export const whyChoose = [
  "Bangladesh-focused solar EPC engineering for commercial and industrial roofs.",
  "Single partner for design, procurement, installation, commissioning and aftercare.",
  "Thermal inspection, cleaning and mapping subdivisions keep assets performing after handover.",
  "Net metering and monitoring support built into the project workflow.",
  "Clear performance reporting that turns solar output into understandable business and environmental results."
];

export const projects = [
  {
    title: "Industrial Rooftop Solar Plant",
    location: "Dhaka Division",
    capacity: "420 kW",
    summary: "Grid-tied rooftop plant for industrial daytime load reduction and net metering readiness.",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Commercial Net Metering System",
    location: "Chattogram",
    capacity: "165 kW",
    summary: "Commercial solar EPC package covering design, installation, commissioning and utility coordination.",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Aerial Thermal Inspection",
    location: "Bangladesh",
    capacity: "650 kW inspected",
    summary: "Drone thermal inspection workflow for operating solar assets and maintenance planning.",
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=80"
  }
];

export const resourceCategories = [
  "Solar Panels",
  "Inverters",
  "Mounting Structures",
  "Cables",
  "Net Metering",
  "Monitoring",
  "Battery/ESS",
  "Solar Economics"
];

export const learningArticles = [
  {
    title: "Choosing Solar Modules For Industrial Roofs",
    category: "Solar Panels",
    slug: "choosing-solar-modules-industrial-roofs",
    excerpt: "Module efficiency, warranty, degradation and roof-fit for C&I solar plants."
  },
  {
    title: "Inverter Selection And Monitoring Basics",
    category: "Inverters",
    slug: "inverter-selection-monitoring-basics",
    excerpt: "String sizing, MPPT windows, monitoring portals and future API integration."
  },
  {
    title: "Net Metering Economics",
    category: "Net Metering",
    slug: "net-metering-economics",
    excerpt: "The brochure model uses 466,533 kWh annual usage and 3.0% energy-cost escalation."
  }
];

export const products = [
  {
    id: "al-pv-580",
    name: "Alektra Mono TOPCon 580W Module",
    slug: "alektra-mono-topcon-580w-module",
    sku: "AL-PV-580-TOPCON",
    model: "AL580N",
    category: "Solar Modules",
    price: 18500,
    stock: 86,
    featured: true,
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    description: "High-efficiency N-type module for C&I rooftop projects.",
    technical: "580W mono TOPCon PV module with improved low-light response and durable mechanical load rating.",
    specs: ["580W", "N-type TOPCon", "12-year product warranty", "30-year linear output"]
  },
  {
    id: "al-inv-50",
    name: "Grid-Tied String Inverter 50kW",
    slug: "grid-tied-string-inverter-50kw",
    sku: "AL-INV-50K-GT",
    model: "GT50K",
    category: "Inverters",
    price: 420000,
    stock: 12,
    featured: true,
    image: "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=1200&q=80",
    description: "C&I string inverter with multi-MPPT architecture and monitoring support.",
    technical: "50kW three-phase grid-tied inverter with multiple MPPT inputs and cloud monitoring readiness.",
    specs: ["50kW AC", "Three phase", "Multi-MPPT", "Wi-Fi/LAN monitoring"]
  },
  {
    id: "al-mnt-kit",
    name: "Aluminium Rooftop Mounting Kit",
    slug: "aluminium-rooftop-mounting-kit",
    sku: "AL-MNT-ROOF-KIT",
    model: "RMK-CI",
    category: "Mounting",
    price: 13500,
    stock: 140,
    featured: false,
    image: "https://images.unsplash.com/photo-1624397640148-949b1732bb0a?auto=format&fit=crop&w=1200&q=80",
    description: "Corrosion-resistant mounting kit for commercial rooftop PV arrays.",
    technical: "Modular aluminium rail, clamps and fastener package for roof-appropriate anchoring.",
    specs: ["Anodized aluminium", "Rooftop", "Corrosion resistant", "Service-access layout"]
  }
];

export const brochureEnergyRows = [
  ["Jan", 26107, 35139, 385376, 126912, 258464],
  ["Feb", 23849, 32000, 354300, 118192, 236108],
  ["Mar", 27845, 41710, 450429, 174765, 275664],
  ["Apr", 25512, 33585, 369992, 117420, 252571],
  ["May", 24342, 45474, 487693, 246703, 240990],
  ["Jun", 20221, 43135, 464536, 264348, 200189],
  ["Jul", 18795, 39833, 431847, 245778, 186068],
  ["Aug", 21457, 41340, 446766, 234340, 212426],
  ["Sep", 20410, 41462, 447974, 245920, 202054],
  ["Oct", 22952, 43407, 467229, 240007, 227222],
  ["Nov", 23433, 38877, 422382, 190400, 231982],
  ["Dec", 25646, 30571, 340153, 86255, 253898]
];
