import { prisma } from "@/lib/prisma";

export const defaultFooterSettings = {
  contactEmail: "contact@alektraepc.com",
  contactPhone: "+880 1735954 844",
  address: "Dhaka, Bangladesh",
  facebookUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  whatsappNumber: "",
  footerDescription:
    "Solar EPC, thermal inspection, cleaning and mapping for renewable-energy assets in Bangladesh.",
  copyrightText: "Copyright (c) Alektra Renewable. All rights reserved."
};

export type FooterSettings = typeof defaultFooterSettings;

export async function getFooterSettings(): Promise<FooterSettings> {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { singletonKey: "footer" } });
    if (!settings) return defaultFooterSettings;
    return {
      contactEmail: settings.contactEmail || defaultFooterSettings.contactEmail,
      contactPhone: settings.contactPhone || defaultFooterSettings.contactPhone,
      address: settings.address || defaultFooterSettings.address,
      facebookUrl: settings.facebookUrl || "",
      linkedinUrl: settings.linkedinUrl || "",
      youtubeUrl: settings.youtubeUrl || "",
      whatsappNumber: settings.whatsappNumber || "",
      footerDescription: settings.footerDescription || defaultFooterSettings.footerDescription,
      copyrightText: settings.copyrightText || defaultFooterSettings.copyrightText
    };
  } catch {
    return defaultFooterSettings;
  }
}
