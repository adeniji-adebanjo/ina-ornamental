export const metadata = {
  title: "Contact | INA Ornamental Fish",
  description:
    "Contact INA Ornamental Fish for B2B ornamental fish export inquiries, catalogue requests, and shipment support.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300 font-semibold mb-3">
            Reach Out To Us
          </p>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            Let&apos;s Build a Reliable Supply Partnership
          </h1>
          <p className="mt-5 text-slate-300 max-w-2xl leading-relaxed">
            For business inquiries, species availability, and shipment planning,
            contact our team directly. We are ready to support wholesalers,
            retailers, and collectors worldwide.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <a
            href="https://wa.me/2348168850307"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-bold text-slate-900">WhatsApp</h2>
            <p className="text-emerald-700 mt-1">+234 816 885 0307</p>
            <p className="text-sm text-slate-500 mt-3">
              Fastest way to discuss inventory and live shipment windows.
            </p>
          </a>

          <a
            href="mailto:alfred@inaornamentalfish.com"
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-bold text-slate-900">Email</h2>
            <p className="text-sky-700 mt-1">alfred@inaornamentalfish.com</p>
            <p className="text-sm text-slate-500 mt-3">
              Send your species list and destination details for a tailored
              quote.
            </p>
          </a>
        </div>

        <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900">Office Location</h3>
          <p className="text-slate-600 mt-1">Lagos, Nigeria</p>
          <p className="text-sm text-slate-500 mt-2">
            B2B Global Export Operations
          </p>
        </div>
      </section>
    </>
  );
}
