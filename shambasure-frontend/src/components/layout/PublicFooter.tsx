// FILE: src/components/layout/PublicFooter.tsx

import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Shield, Lock, type LucideIcon } from 'lucide-react';


import { Logo } from '../common/Logo';

// --- Data (Defined outside the component for performance) ---

const productLinks = [
  { id: 'features', to: '/features' },
  { id: 'trust_security', to: '/security' },
  { id: 'pricing', to: '/pricing' },
  { id: 'about', to: '/about' },
];

const supportLinks = [
  { id: 'contact', to: '/contact' },
  { id: 'help_center', to: '/help' },
  { id: 'faq', to: '/faq' },
  { id: 'community', to: '/community' },
];

const legalLinks = [
  { id: 'privacy_policy', to: '/privacy-policy' },
  { id: 'terms_of_service', to: '/terms-of-service' },
];

// --- Sub-components for Readability ---

type FooterLinkColumnProps = {
  titleKey: string;
  links: { id: string; to: string }[];
  t: (key: string) => string;
};

const FooterLinkColumn: React.FC<FooterLinkColumnProps> = ({ titleKey, links, t }) => (
  <div>
    <h3 className="font-serif text-sm font-semibold uppercase tracking-elegant text-text">
      {t(titleKey)}
    </h3>
    <ul className="mt-4 space-y-3">
      {links.map((link) => (
        <li key={link.id}>
          <Link
            to={link.to}
            className="text-sm text-text-subtle transition-colors duration-300 hover:text-primary"
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
      className="flex items-start gap-3 text-sm text-text-subtle transition-colors duration-300 hover:text-primary"
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{text}</span>
    </a>
  </li>
);


// --- Main Component ---

export function PublicFooter() {
  const { t } = useTranslation(['public_footer', 'common']);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-background-subtle font-sans">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-20">
        
        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
          
          {/* Brand Section */}
          <div className="col-span-1 space-y-6">
            <Link to="/" className="inline-block transition-opacity hover:opacity-80">
              <Logo className="h-12 w-12" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-text-subtle">
              {t('tagline', 'Preserving generational wealth through trusted digital estate planning.')}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Shield className="h-4 w-4" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Lock className="h-4 w-4" />
                <span>Encrypted</span>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="col-span-1 grid grid-cols-2 gap-8 lg:col-span-2 sm:grid-cols-3">
            <FooterLinkColumn titleKey="headings.product" links={productLinks} t={t} />
            <FooterLinkColumn titleKey="headings.support" links={supportLinks} t={t} />

            {/* Contact Column */}
            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-serif text-sm font-semibold uppercase tracking-elegant text-text">
                {t('headings.contact', 'Contact')}
              </h3>
              <ul className="mt-4 space-y-4">
                <ContactLink href="mailto:info@shambasure.com" Icon={Mail} text="info@shambasure.com" />
                <ContactLink href="tel:+254700000000" Icon={Phone} text="+254 700 000 000" />
                <li>
                  <div className="flex items-start gap-3 text-sm text-text-subtle">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>Nairobi, Kenya</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Unified Bottom Bar */}
        <div className="mt-16 border-t border-neutral-200 pt-8">
          <div className="flex flex-col-reverse items-center justify-between gap-6 sm:flex-row">
            <p className="text-xs text-text-muted">
              &copy; {currentYear} {t('copyright', 'Shamba Sure. All rights reserved.')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.to}
                  className="text-xs text-text-muted transition-colors duration-300 hover:text-primary"
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
