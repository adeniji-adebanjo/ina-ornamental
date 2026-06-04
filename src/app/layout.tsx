import type { Metadata } from "next";
import { STIX_Two_Text, Manrope, Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const stixTwoText = STIX_Two_Text({
  variable: "--font-stix-two-text",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INA Ornamental Fish | West African Ornamental Fish Exporter",
  description:
    "Expert exporter of premium West African ornamental fish. Ethically sourced African aquarium fish, B2B specialists delivering worldwide with live arrival guarantee.",
  keywords: [
    "ornamental fish",
    "West African fish",
    "aquarium fish exporter",
    "Nigerian fish",
    "bichirs",
    "cichlids",
    "tetras",
    "polypterus",
    "exotic fish",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", stixTwoText.variable, manrope.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
