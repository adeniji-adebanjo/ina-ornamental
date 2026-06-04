import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Years of Experience", value: "22+" },
  { label: "Species Available", value: "120+" },
  { label: "Countries Reached", value: "30+" },
  { label: "Clients Served", value: "500+" },
];

export default function Stats() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="text-center border-slate-100 bg-slate-50 rounded-2xl"
          >
            <CardContent className="p-4">
              <p className="text-2xl md:text-3xl font-black text-sky-800">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
