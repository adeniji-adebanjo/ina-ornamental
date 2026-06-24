import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const features = [
  {
    title: "Ethically Sourced, Quality Guaranteed",
    body: "Every species is sourced from trusted breeders and collectors, conditioned in our Lagos facility, and health-checked before export.",
  },
  {
    title: "End-to-End Export Logistics",
    body: "Professional packing, CITES compliance, airline coordination, and live-arrival focus — we handle everything from our door to yours.",
  },
  {
    title: "Dedicated B2B Partnerships",
    body: "Custom pricing, recurring order support, and a dedicated account manager for wholesalers, retailers, and specialist collectors worldwide.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          Why Global Buyers Choose INÁ Ornamental Fish
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
