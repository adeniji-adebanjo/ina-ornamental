import type { Metadata } from "next";
import { STIX_Two_Text, Manrope, Geist } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";
import Providers from "@/components/Providers";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const stixTwoText = STIX_Two_Text({
  variable: "--font-stix-two-text",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://inaornamentalfish.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "INA Ornamental Fish | West African Ornamental Fish Exporter",
    template: "%s | INA Ornamental Fish",
  },
  description:
    "Expert exporter of premium West African ornamental fish. Ethically sourced African aquarium fish, B2B specialists delivering worldwide with live arrival guarantee.",
  keywords: [
    "ornamental fish",
    "West African fish",
    "aquarium fish exporter",
    "Nigerian fish exporter",
    "bichirs",
    "cichlids",
    "tetras",
    "polypterus",
    "exotic fish",
    "live fish export",
    "African aquarium fish",
    "B2B fish supplier",
    "ornamental fish wholesale",
  ],
  authors: [{ name: "INA Ornamental Fish" }],
  creator: "INA Ornamental Fish",
  publisher: "INA Ornamental Fish",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "INA Ornamental Fish",
    title: "INA Ornamental Fish | West African Ornamental Fish Exporter",
    description:
      "Expert exporter of premium West African ornamental fish. Ethically sourced, B2B specialists delivering worldwide with live arrival guarantee.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "INA Ornamental Fish Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "INA Ornamental Fish | West African Ornamental Fish Exporter",
    description:
      "Expert exporter of premium West African ornamental fish. Ethically sourced, B2B specialists delivering worldwide.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "en-GB": SITE_URL,
      "en-DE": SITE_URL,
      "en-NL": SITE_URL,
      "en-JP": SITE_URL,
      "en-CN": SITE_URL,
      "en-HK": SITE_URL,
      "en-SG": SITE_URL,
      "en-RU": SITE_URL,
      "en-AE": SITE_URL,
      "x-default": SITE_URL,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        stixTwoText.variable,
        manrope.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
