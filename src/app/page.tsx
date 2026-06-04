import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import FeaturedSpecies from "@/components/home/FeaturedSpecies";
import CtaBanner from "@/components/home/CtaBanner";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <WhyChooseUs />
      <FeaturedSpecies />
      <CtaBanner />
    </>
  );
}
