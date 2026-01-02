// FILE: src/components/layout/PublicFooter.tsx
// CONTEXT: Mirathi (High Trust, Institutional Style)

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Linkedin, 
  Twitter, 
  Facebook, 
  MapPin, 
  Mail,
  Scale
} from 'lucide-react';

import { Logo } from '../common/Logo';

export function PublicFooter() {
  useTranslation(['footer', 'common']);
  const currentYear = new Date().getFullYear();

  // MARKETING LINKS (Not Backend Services)
  const solutions = [
    { label: 'For Executors', to: '/solutions/executors' },
    { label: 'For Families', to: '/solutions/families' },
    { label: 'Digital Asset Vault', to: '/features/vault' },
    { label: 'Probate Automation', to: '/features/probate' },
  ];

  const company = [
    { label: 'About Mirathi', to: '/about' },
    { label: 'Security & Trust', to: '/security' },
    { label: 'Partner with Us', to: '/partners' },
    { label: 'Careers', to: '/careers' },
  ];

  const legal = [
    { label: 'Privacy Policy', to: '/legal/privacy' },
    { label: 'Terms of Service', to: '/legal/terms' },
    { label: 'Acceptable Use', to: '/legal/acceptable-use' },
  ];

  return (
    <footer className="bg-[#0F3D3E] text-white print:hidden">
      {/* 1. Main Footer Content */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-8">
            <Link to="/" className="block">
              {/* Using the White variant of the logo for dark background */}
              <Logo className="h-12 w-auto text-white" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-300">
              The Active Intelligence Engine for estate planning and succession. 
              We preserve harmony and value when it matters most.
            </p>
            <div className="flex space-x-5">
              <a href="#" className="text-neutral-400 hover:text-[#C8A165] transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-[#C8A165] transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-[#C8A165] transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#C8A165]">
                  Solutions
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {solutions.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className="text-sm text-neutral-300 hover:text-white hover:underline decoration-[#C8A165] underline-offset-4 transition-all">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#C8A165]">
                  Company
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {company.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className="text-sm text-neutral-300 hover:text-white hover:underline decoration-[#C8A165] underline-offset-4 transition-all">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#C8A165]">
                  Legal Resources
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link to="/resources/cap-160" className="text-sm text-neutral-300 hover:text-white hover:underline decoration-[#C8A165] underline-offset-4 transition-all">
                      Guide to Cap 160
                    </Link>
                  </li>
                  <li>
                    <Link to="/resources/wills" className="text-sm text-neutral-300 hover:text-white hover:underline decoration-[#C8A165] underline-offset-4 transition-all">
                      Writing a Will
                    </Link>
                  </li>
                  <li>
                    <Link to="/directory" className="text-sm text-neutral-300 hover:text-white hover:underline decoration-[#C8A165] underline-offset-4 transition-all">
                      Find a Lawyer
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#C8A165]">
                  Contact
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li className="flex items-center gap-2 text-sm text-neutral-300">
                    <Mail className="h-4 w-4 text-[#C8A165]" />
                    <span>support@mirathi.com</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-neutral-300">
                    <MapPin className="h-4 w-4 text-[#C8A165] mt-0.5" />
                    <span>Nairobi, Kenya</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Legal Disclaimer (Crucial for LegalTech) */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <div className="rounded-lg bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex gap-3">
              <Scale className="h-5 w-5 flex-shrink-0 text-[#C8A165]" />
              <p className="text-xs leading-relaxed text-neutral-400">
                <span className="font-bold text-neutral-300">Disclaimer:</span> Mirathi is a technology platform that streamlines estate planning and succession administration. We provide information and automation, not legal advice. The "Readiness Score" and generated forms should be reviewed by a qualified Advocate of the High Court of Kenya.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-neutral-400">
            &copy; {currentYear} Mirathi Systems Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legal.map((item) => (
              <Link key={item.label} to={item.to} className="text-xs text-neutral-400 hover:text-[#C8A165]">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">Bank-Grade Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}