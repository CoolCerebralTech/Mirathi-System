// FILE: src/components/layout/PublicFooter.tsx
// CONTEXT: Mirathi (Dark Mode, Legal-Tech Compliance)

import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  Scale, 
  Server,
  type LucideIcon 
} from 'lucide-react';

import { Logo } from '../common/Logo';

// --- Data ---

// Mapped to the System Architecture
const productLinks = [
  { id: 'family_service', to: '/features#family' },
  { id: 'estate_service', to: '/features#estate' },
  { id: 'succession_service', to: '/features#succession' },
  { id: 'document_vault', to: '/features#documents' },
];

const resourceLinks = [
  { id: 'knowledge_base', to: '/learn' },
  { id: 'cap_160_guide', to: '/learn/law-of-succession' },
  { id: 'security_whitepaper', to: '/security' },
  { id: 'developer_api', to: '/docs/api' },
];

const legalLinks = [
  { id: 'privacy_policy', to: '/privacy-policy' },
  { id: 'terms_of_service', to: '/terms-of-service' },
  { id: 'data_protection_addendum', to: '/dpa' },
];

// --- Sub-components ---

type FooterLinkColumnProps = {
  titleKey: string;
  links: { id: string; to: string }[];
  t: (key: string) => string;
};

const FooterLinkColumn: React.FC<FooterLinkColumnProps> = ({ titleKey, links, t }) => (
  <div>
    <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-amber-500">
      {t(titleKey)}
    </h3>
    <ul className="mt-6 space-y-4">
      {links.map((link) => (
        <li key={link.id}>
          <Link
            to={link.to}
            className="text-sm text-slate-400 transition-colors duration-300 hover:text-white hover:translate-x-1 inline-block"
          >
            {t(`links.${link.id}`)}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

type ContactLinkProps = {
  href: string;
  Icon: LucideIcon;
  text: string;
};

const ContactLink: React.FC<ContactLinkProps> = ({ href, Icon, text }) => (
  <li>
    <a
      href={href}
      className="group flex items-start gap-3 text-sm text-slate-400 transition-colors duration-300 hover:text-amber-400"
    >
      <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-slate-800 group-hover:bg-amber-500/10 transition-colors">
        <Icon className="h-3 w-3" />
      </div>
      <span className="leading-relaxed">{text}</span>
    </a>
  </li>
);

// --- Main Component ---

export function PublicFooter() {
  const { t } = useTranslation(['public_footer', 'common']);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 font-sans text-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-20">
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-4 lg:gap-8">
          
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-1 space-y-8">
            <Link to="/" className="inline-block transition-opacity hover:opacity-80">
              <Logo 
                sizeClassName="h-12 w-auto" 
                className="text-white" 
                showTagline={false} // Clean logo for footer
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              {t('tagline', 'The Active Intelligence Engine for Kenyan Succession. Deterministic, Secure, and Legally Compliant.')}
            </p>
            
            {/* Trust Badges */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-slate-400">SOC 2 Compliant Infrastructure</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <Lock className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-slate-400">AES-256 Data Vault</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <Server className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-slate-400">Kenyan Data Sovereignty</span>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="col-span-1 grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-3">
            <FooterLinkColumn titleKey="headings.platform" links={productLinks} t={t} />
            <FooterLinkColumn titleKey="headings.resources" links={resourceLinks} t={t} />

            {/* Contact Column */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-amber-500">
                {t('headings.contact', 'Contact')}
              </h3>
              <ul className="mt-6 space-y-5">
                <ContactLink href="mailto:legal@mirathi.com" Icon={Mail} text="legal@mirathi.com" />
                <ContactLink href="tel:+254700000000" Icon={Phone} text="+254 700 MIRATHI" />
                <li>
                  <div className="flex items-start gap-3 text-sm text-slate-400">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-slate-800">
                      <MapPin className="h-3 w-3" />
                    </div>
                    <span className="leading-relaxed">
                      Mirathi Legal Tech Labs<br />
                      Nairobi, Kenya
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Bottom Bar */}
        <div className="mt-16 border-t border-slate-800 pt-8">
          
          {/* Important LegalTech Disclaimer */}
          <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
             <div className="flex gap-3">
               <Scale className="h-5 w-5 flex-shrink-0 text-slate-500" />
               <p className="text-xs leading-relaxed text-slate-500">
                 <strong>Disclaimer:</strong> {t('disclaimer', 'Mirathi is a technology platform that automates the generation of legal forms based on user input. We are not a law firm and do not provide legal advice. The "Readiness Score" and "Succession Copilot" are for informational purposes only. For complex disputes, please consult an Advocate of the High Court of Kenya.')}
               </p>
             </div>
          </div>

          <div className="flex flex-col-reverse items-center justify-between gap-6 sm:flex-row">
            <p className="text-xs text-slate-500">
              &copy; {currentYear} {t('copyright', 'Mirathi. All rights reserved.')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.to}
                  className="text-xs text-slate-500 transition-colors duration-300 hover:text-amber-400"
                >
                  {t(`links.${link.id}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}