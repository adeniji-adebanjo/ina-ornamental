import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "About",
  description:
    "Learn about INA Ornamental Fish, a leading West African ornamental fish exporter with over 22 years of experience in ethically sourcing and exporting premium African aquarium species.",
  alternates: { canonical: "/about" },
};

const highlights = [
  "22+ years exporting West African ornamental species",
  "Ethical sourcing from trusted breeders and collectors",
  "Rigorous health checks and acclimation processes",
  "Custom packaging and logistics for safe global delivery",
  "Strong B2B partnerships across Asia, Russia, UK, and USA",
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-linear-to-br from-sky-900 via-sky-800 to-emerald-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-200 font-semibold mb-3">
            About INA Ornamental Fish
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight">
            Trusted West African Ornamental Fish Export Specialists
          </h1>
          <p className="mt-5 text-sky-100 max-w-3xl leading-relaxed">
            As a leading West African ornamental fish exporter and a subsidiary
            of Monehin Global Fish Ltd. Nigeria, INA Ornamental Fish has been
            serving international aquarium businesses with premium quality
            species for over two decades.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <Card className="border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-6 md:p-8">
            <p className="text-slate-600 leading-relaxed">
              Our facilities are equipped with modern systems that help us
              acclimate wild-caught species to aquarium conditions. We
              specialize in freshwater ornamental fishes, crustaceans, molluscs,
              amphibians, and other exotic aquatic animals from West Africa.
              Every shipment goes through careful conditioning, packing, and
              compliance checks to ensure healthy arrivals in destination
              countries.
            </p>
            <p className="text-slate-600 leading-relaxed mt-4">
              We build long-term B2B partnerships by focusing on quality,
              communication, and operational consistency. Our mission is to make
              your stocking process simple, profitable, and reliable.
            </p>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {highlights.map((item) => (
            <Card
              key={item}
              className="border-slate-100 bg-slate-50 rounded-xl"
            >
              <CardContent className="p-4 flex items-start gap-3">
                <CheckCircle className="size-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{item}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
