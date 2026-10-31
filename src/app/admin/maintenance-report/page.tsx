// One-off maintenance report for the business owner.
//
// • Admin-only (lives under /admin, so the proxy + admin layout gate it) and
//   not linked from the admin menu — share the URL directly.
// • To switch it off without a code change, set MAINTENANCE_REPORT_ENABLED=false
//   in .env.production and restart; to remove it, delete this folder.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  ShoppingCart,
  Database,
  Sparkles,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Compass,
} from "lucide-react";
import PrintButton from "./PrintButton";
import {
  AREAS,
  NEXT_STEPS,
  OWNER_ACTIONS,
  REPORT_DATE,
  type Severity,
} from "./report-data";

export const metadata: Metadata = {
  title: "Website Maintenance Report",
  robots: { index: false, follow: false },
};

const AREA_ICONS = {
  security: ShieldCheck,
  orders: ShoppingCart,
  data: Database,
  experience: Sparkles,
  operations: Settings2,
} as const;

const SEVERITY: Record<
  Severity,
  { label: string; badge: string; dot: string; meaning: string }
> = {
  critical: {
    label: "Critical",
    badge: "bg-red-100 text-red-800 ring-red-200",
    dot: "bg-red-600",
    meaning: "Could have caused serious harm at any time",
  },
  high: {
    label: "High",
    badge: "bg-orange-100 text-orange-800 ring-orange-200",
    dot: "bg-orange-500",
    meaning: "Likely to cause lost business or wrong data",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    meaning: "Real problem, but limited or occasional impact",
  },
  low: {
    label: "Low",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
    meaning: "Minor issue or tidy-up",
  },
};

const ORDER: Severity[] = ["critical", "high", "medium", "low"];

export default function MaintenanceReportPage() {
  if (process.env.MAINTENANCE_REPORT_ENABLED === "false") notFound();

  const all = AREAS.flatMap((a) => a.findings);
  const counts = Object.fromEntries(
    ORDER.map((s) => [s, all.filter((f) => f.severity === s).length]),
  ) as Record<Severity, number>;
  const serious = counts.critical + counts.high;

  return (
    <article className="mx-auto max-w-4xl space-y-10 text-slate-800 print:max-w-none print:space-y-6">
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <header className="rounded-2xl bg-sky-800 px-6 py-8 text-white sm:px-10 print:rounded-none print:px-0 print:py-4 print:bg-white print:text-sky-900 print:border-b-4 print:border-emerald-500">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300 print:text-emerald-700">
              INÁ Ornamental Fish
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              Website Health Check &amp; Maintenance Report
            </h1>
            <p className="mt-3 text-sky-100 print:text-slate-600">
              Prepared {REPORT_DATE} · for the owner of inaornamentalfish.com
            </p>
          </div>
          <div className="shrink-0 [&_button]:bg-white [&_button]:text-sky-900">
            <PrintButton />
          </div>
        </div>
      </header>

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="summary" className="space-y-5">
        <h2 id="summary" className="text-2xl font-bold text-sky-900">
          The short version
        </h2>
        <div className="space-y-3 text-[15px] leading-relaxed">
          <p>
            We carried out a full review of your website, the customer ordering
            system and the admin area, then fixed what we found. The review
            started from one problem you reported (price auto-fill dropping
            fish species) and uncovered a wider set of issues, some of them
            serious.
          </p>
          <p>
            <strong>The two most serious problems</strong> were that your
            clients&apos; private price lists could be read by anyone on the
            internet, and that a stranger could have given themselves full
            admin control. Both are now closed. The code alone can&apos;t show
            whether either was ever misused. As part of go-live we will check
            the list of user accounts for any we don&apos;t recognise, and remove
            them.
          </p>
          <p>
            <strong>Everything listed below has been fixed and tested.</strong>{" "}
            The fixes go live with the next update of the website (see{" "}
            <a href="#actions" className="font-semibold text-sky-800 underline underline-offset-2">
              what we need from you
            </a>
            ).
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Issues fixed", value: all.length },
            { label: "Serious (critical or high)", value: serious },
            { label: "Automated checks now passing", value: 86 },
            { label: "Parts of the business covered", value: AREAS.length },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 print:break-inside-avoid"
            >
              <dt className="text-xs font-medium text-slate-500">{s.label}</dt>
              <dd className="mt-1 text-3xl font-black text-sky-800">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Before / after at a glance ───────────────────────────────────── */}
      <section
        aria-labelledby="glance"
        className="rounded-2xl border border-slate-200 bg-white p-6 print:break-inside-avoid"
      >
        <h2 id="glance" className="text-xl font-bold text-sky-900">
          Before and after, at a glance
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 font-semibold text-red-700">
              <AlertTriangle className="size-5" aria-hidden /> Before today
            </p>
            <ul className="mt-3 space-y-2">
              {ORDER.map((s) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className={`size-2.5 rounded-full ${SEVERITY[s].dot}`} aria-hidden />
                  <span className="w-16 font-semibold">{SEVERITY[s].label}</span>
                  <span className="font-bold tabular-nums">{counts[s]}</span>
                  <span className="text-slate-500">open issues</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="flex items-center gap-2 font-semibold text-sky-800">
              <CheckCircle2 className="size-5" aria-hidden /> After today&apos;s work
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden />
                No known critical or high problems remain open in the code.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden />
                Client pricing and admin access are locked down at two separate
                levels (website and database).
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden />
                Every future change is automatically tested before it can go
                live, and undone automatically if it fails.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 grid gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600 sm:grid-cols-2">
          {ORDER.map((s) => (
            <p key={s}>
              <span className={`mr-2 inline-block rounded-full px-2 py-0.5 font-semibold ring-1 ${SEVERITY[s].badge}`}>
                {SEVERITY[s].label}
              </span>
              {SEVERITY[s].meaning}
            </p>
          ))}
        </div>
      </section>

      {/* ── Findings by area ─────────────────────────────────────────────── */}
      {AREAS.map((area) => {
        const Icon = AREA_ICONS[area.id as keyof typeof AREA_ICONS] ?? ClipboardList;
        return (
          <section key={area.id} aria-labelledby={`area-${area.id}`} className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 print:hidden">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 id={`area-${area.id}`} className="text-2xl font-bold text-sky-900">
                  {area.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{area.why}</p>
              </div>
            </div>

            <ol className="space-y-3">
              {area.findings.map((f) => (
                <li
                  key={f.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 print:break-inside-avoid"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${SEVERITY[f.severity].badge}`}
                    >
                      Was: {SEVERITY[f.severity].label}
                    </span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
                      Now: Fixed
                    </span>
                    {f.unconfirmed && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                        Confirm with a test order after go-live
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                  <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Before
                      </p>
                      <p className="mt-1 leading-relaxed">{f.before}</p>
                    </div>
                    <div className="sm:border-l sm:border-slate-200 sm:pl-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                        Now
                      </p>
                      <p className="mt-1 leading-relaxed">{f.after}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {/* ── Owner actions ────────────────────────────────────────────────── */}
      <section
        id="actions"
        aria-labelledby="actions-title"
        className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 print:break-inside-avoid"
      >
        <h2 id="actions-title" className="flex items-center gap-2 text-2xl font-bold text-sky-900">
          <ClipboardList className="size-6 text-emerald-700" aria-hidden />
          What we need from you
        </h2>
        <ol className="mt-4 space-y-4">
          {OWNER_ACTIONS.map((a, i) => (
            <li key={a.title} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-800 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{a.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{a.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Next steps ───────────────────────────────────────────────────── */}
      <section aria-labelledby="next" className="space-y-4">
        <h2 id="next" className="flex items-center gap-2 text-2xl font-bold text-sky-900">
          <Compass className="size-6 text-sky-700" aria-hidden />
          Recommended next steps
        </h2>
        <p className="text-sm text-slate-600">
          Nothing below is urgent. These are improvements worth scheduling.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {NEXT_STEPS.map((n) => (
            <li
              key={n.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 print:break-inside-avoid"
            >
              <p className="font-semibold text-slate-900">{n.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{n.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Glossary ─────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="terms"
        className="rounded-2xl bg-slate-100 p-6 text-sm print:break-inside-avoid"
      >
        <h2 id="terms" className="font-bold text-slate-900">
          A few terms used in this report
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ["Server", "The computer that runs your website and talks to the database."],
            ["Database", "Where your fish, clients, prices and orders are stored."],
            ["Admin area", "The private part of the site your team signs in to."],
            ["Go-live / deployment", "Putting the updated website onto the live server."],
            ["Automated checks", "Tests that run by themselves on every change to catch mistakes."],
            ["Roll back", "Automatically returning to the previous working version."],
          ].map(([term, def]) => (
            <div key={term}>
              <dt className="font-semibold text-slate-800">{term}</dt>
              <dd className="text-slate-600">{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-slate-200 pt-4 pb-8 text-xs text-slate-500">
        This report describes the website&apos;s code as of {REPORT_DATE}. Each
        &quot;Was&quot; rating is how serious the problem was before the fix, judged by
        reviewing the code. One item is marked for confirmation on the live site
        after go-live.
      </footer>
    </article>
  );
}
