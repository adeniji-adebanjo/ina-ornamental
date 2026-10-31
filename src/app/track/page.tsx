import { pageOpenGraph } from "@/app/shared-metadata";
import TrackShipmentClient from "./TrackShipmentClient";

export const metadata = {
  title: "Track Your Shipment",
  description:
    "Track your INÁ Ornamental Fish air cargo shipment. Enter your order reference to see live flight status on the airline's official cargo portal.",
  alternates: { canonical: "/track" },
  openGraph: pageOpenGraph({
    title: "Track Your Shipment | INÁ Ornamental Fish",
    description:
      "Enter your order reference to see live flight status for your air cargo shipment on the airline's official cargo portal.",
    url: "/track",
  }),
};

export default function TrackPage() {
  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300 font-semibold mb-3">
            Shipment Tracking
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-tight">
            Follow Your Fish, Flight by Flight
          </h1>
          <p className="mt-5 text-slate-300 max-w-2xl leading-relaxed">
            Enter your order reference and the email you ordered with. Once your
            consignment is booked, we&apos;ll show your Air Waybill and link you
            straight to the airline&apos;s own cargo portal for live status.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <TrackShipmentClient />
      </section>
    </>
  );
}
