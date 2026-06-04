import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Mail, MapPin } from "lucide-react";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/order", label: "Request Quote" },
];

const speciesLinks = [
  { href: "/catalogue?category=Polypterus", label: "Bichirs & Polypterus" },
  { href: "/catalogue?category=Cichlids", label: "African Cichlids" },
  { href: "/catalogue?category=Tetras", label: "Tetras & Characins" },
  { href: "/catalogue?category=Catfish", label: "Catfish & Synodontis" },
  { href: "/catalogue?category=Crabs", label: "Crabs & Crustaceans" },
  { href: "/catalogue?category=Oddballs", label: "Oddballs & Rarities" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/ina-logo.png"
                alt="INA Ornamental Fish logo"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Premium quality West African tropical aquarium fishes at best
              prices. A subsidiary of Monehin Global Fish Ltd. and member of
              Ornamental Fish International (OFI).
            </p>
            <p className="text-xs text-slate-500">
              22+ years of experience exporting exotic species worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Species */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Species
            </h3>
            <ul className="space-y-2.5">
              {speciesLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MessageCircle className="size-5 text-emerald-400 mt-0.5 shrink-0" />
                <a
                  href="https://wa.me/2348168850307"
                  className="text-sm hover:text-emerald-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +234 816 885 0307
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="size-5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <a
                    href="mailto:alfred@inaornamentalfish.com"
                    className="hover:text-emerald-400 transition-colors block"
                  >
                    alfred@inaornamentalfish.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="size-5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm">Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mt-12 bg-slate-800" />
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} INA Ornamental Fish Export. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/inaornamentalfish/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-emerald-400 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
