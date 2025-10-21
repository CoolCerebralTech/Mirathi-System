// FILE: src/components/layout/PublicFooter.tsx

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Shield, Lock, Award } from 'lucide-react';

import { Logo } from '../common/Logo';

export function PublicFooter() {
  const { t } = useTranslation(['public_footer', 'common']);
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { labelKey: 'links.features', to: '/features' },
    { labelKey: 'links.trust_security', to: '/security' },
    { labelKey: 'links.pricing', to: '/pricing' },
    { labelKey: 'links.about', to: '/about' },
  ];

  const legalLinks = [
    { labelKey: 'links.privacy_policy', to: '/privacy-policy' },
    { labelKey: 'links.terms_of_service', to: '/terms-of-service' },
    { labelKey: 'links.cookie_policy', to: '/cookie-policy' },
    { labelKey: 'links.data_protection', to: '/data-protection' },
  ];

  const supportLinks = [
    { labelKey: 'links.contact', to: '/contact' },
    { labelKey: 'links.help_center', to: '/help' },
    { labelKey: 'links.faq', to: '/faq' },
    { labelKey: 'links.community', to: '/community' },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-background-subtle font-sans">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <Link to="/" className="inline-block transition-opacity hover:opacity-80">
              <Logo />
            </Link>
            <p className="text-sm leading-relaxed text-text-subtle">
              {t('tagline', 'Preserving generational wealth through trusted digital estate planning.')}
            </p>
            
            {/* Trust Badges */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 rounded-classic bg-background px-2.5 py-1.5 shadow-subtle">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-text">SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-classic bg-background px-2.5 py-1.5 shadow-subtle">
                <Lock className="h-4 w-4 text-secondary" />
                <span className="text-xs font-medium text-text">Encrypted</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-text">
              {t('headings.product', 'Product')}
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-subtle transition-colors duration-300 hover:text-primary"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-text">
              {t('headings.support', 'Support')}
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-subtle transition-colors duration-300 hover:text-primary"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-text">
              {t('headings.contact', 'Contact')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:info@shambasure.com"
                  className="flex items-start gap-2 text-sm text-text-subtle transition-colors duration-300 hover:text-primary"
                >
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>info@shambasure.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+254700000000"
                  className="flex items-start gap-2 text-sm text-text-subtle transition-colors duration-300 hover:text-primary"
                >
                  <Phone className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>+254 700 000 000</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2 text-sm text-text-subtle">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>Nairobi, Kenya</span>
                </div>
              </li>
            </ul>

            {/* Compliance Badge */}
            <div className="mt-4 flex items-center gap-2 rounded-classic border border-neutral-300 bg-background px-3 py-2">
              <Award className="h-5 w-5 text-primary" />
              <div className="text-xs">
                <div className="font-semibold text-text">KDPA Compliant</div>
                <div className="text-text-muted">Data Protection Act</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links Section */}
        <div className="border-t border-neutral-200 py-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-text-muted transition-colors duration-300 hover:text-primary"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-neutral-200 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-xs text-text-muted md:text-left">
              &copy; {currentYear} {t('copyright', 'Shamba Sure. All rights reserved.')}
            </p>
            <p className="text-center text-xs text-text-muted md:text-right">
              {t('built_with', 'Built with trust for Kenyan families')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
