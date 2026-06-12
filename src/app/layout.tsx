import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alektraepc.com"),
  title: {
    default: "Alektra Renewable | Solar EPC Bangladesh",
    template: "%s | Alektra Renewable"
  },
  description:
    "Premium solar EPC, aerial thermal inspection, solar panel cleaning and mapping services for Bangladesh commercial and industrial clients.",
  openGraph: {
    title: "Alektra Renewable",
    description: "Solar EPC, thermal inspection, panel cleaning and mapping services.",
    url: "https://www.alektraepc.com",
    siteName: "Alektra Renewable",
    images: [{ url: "/brand/alektra-logo.svg", width: 1200, height: 630 }],
    locale: "en_BD",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
