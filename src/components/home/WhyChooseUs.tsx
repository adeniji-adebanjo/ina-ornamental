import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const features = [
  {
    title: "Ethically Sourced African Aquarium Fish",
    body: "Partnering with responsible breeders and collectors while prioritizing sustainable practices and fish well-being.",
  },
  {
    title: "Customized Logistics, Specialized Exotic Care",
    body: "Tailored global export operations with careful packing, live arrival focus, and smooth documentation workflows.",
  },
  {
    title: "Invested B2B Partnership",
    body: "Dedicated account support for wholesalers, retailers, and specialized collectors across global markets.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          Why Global Buyers Choose INA Export
        </h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-slate-100 rounded-2xl shadow-sm"
            >
              <CardHeader>
                <CardTitle className="font-bold text-slate-900 leading-tight">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 leading-relaxed">
                  {feature.body}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
