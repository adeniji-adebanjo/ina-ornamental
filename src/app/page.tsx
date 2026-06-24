import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import FeaturedSpecies from "@/components/home/FeaturedSpecies";
import CtaBanner from "@/components/home/CtaBanner";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://inaornamentalfish.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "INÁ Ornamental Fish",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
      description:
        "Expert exporter of premium West African ornamental fish. Ethically sourced African aquarium fish, B2B specialists delivering worldwide with live arrival guarantee.",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        url: "https://wa.me/2348168850307",
        availableLanguage: "English",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "INÁ Ornamental Fish",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "INÁ Ornamental Fish | West African Ornamental Fish Exporter",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      description:
        "Expert exporter of premium West African ornamental fish. Ethically sourced, B2B specialists delivering worldwide.",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Stats />
      <WhyChooseUs />
      <FeaturedSpecies />
      <CtaBanner />
    </>
  );
}
