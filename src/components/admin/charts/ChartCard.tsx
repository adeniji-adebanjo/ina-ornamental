import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// A titled chart container. Kept as a plain server component so it composes with
// both server-rendered bar lists and the client-side trend chart.
export function ChartCard({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("rounded-xl", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
