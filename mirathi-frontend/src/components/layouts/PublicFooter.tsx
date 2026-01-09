// FILE: src/components/layouts/PublicFooter.tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Linkedin, 
  Twitter, 
  MapPin, 
  Mail,
  Scale,
  Shield
} from 'lucide-react';
import { Logo } from '../common/Logo';

export function PublicFooter() {
  useTranslation(['footer', 'common']);
  const currentYear = new Date().getFullYear();

  const company = [
    { label: 'About Mirathi', to: '/about' },
    { label: 'Security & Trust', to: '/security' },
    { label: 'Partners', to: '/partners' },
  ];

  const legal = [
    { label: 'Privacy Policy', to: '/legal/privacy' },
    { label: 'Terms of Service', to: '/legal/terms' },
    { label: 'Disclaimer', to: '/legal/disclaimer' },
  ];

  return (
    <footer className="bg-slate-900 text-white print:hidden border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Brand */}
          <div className="space-y-8">
            <Link to="/" className="block">
              <Logo className="h-12 w-auto text-white" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Digital platform for secure estate planning and succession administration in Kenya. 
              Preserving family legacy with statutory compliance.
            </p>
            <div className="flex space-x-5">
              <a 
                href="https://linkedin.com/company/mirathi" 
                aria-label="Mirathi on LinkedIn"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/mirathi" 
                aria-label="Mirathi on X"
                className="text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="space-y-8">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-emerald-400">
                Company
              </h3>
              <ul role="list" className="space-y-4 text-sm text-slate-400">
                {company.map((item) => (
                  <li key={item.label}>
                    <Link 
                      to={item.to} 
                      className="hover:text-white hover:underline decoration-emerald-400 underline-offset-4 transition-all"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-8">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-emerald-400">
                Contact
              </h3>
              <ul role="list" className="space-y-4 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>support@mirathi.ke</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Nairobi, Kenya</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer - Critical for LegalTech */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="bg-slate-800/50 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300 mb-1 font-semibold">
                  Important Disclaimer
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mirathi provides technology tools for estate administration. This platform does not 
                  provide legal advice. All outputs must be reviewed by a qualified Advocate of the High 
                  Court of Kenya. We comply with Cap 160 and related succession laws.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-slate-500">
            © {currentYear} Mirathi Systems Ltd. All rights reserved. Regulated under Kenyan Data Protection Act.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            {legal.map((item) => (
              <Link 
                key={item.label} 
                to={item.to} 
                className="hover:text-emerald-400 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/5 px-3 py-1.5">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Bank-Grade Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}