// FILE: src/components/layout/AuthLayout.tsx
// VERSION 2: Old Money Refined - Elegant Authentication Experience

import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import { Logo } from '../common/Logo';

/**
 * A specialized layout for authentication pages (Login, Register, etc.).
 * Provides an elegant, trust-building environment that separates auth
 * from the main application while reinforcing brand values.
 * 
 * Features:
 * - Split-screen design (form left, brand right)
 * - Trust indicators and security messaging
 * - Responsive mobile-first approach
 * - Old money aesthetic throughout
 */
export function AuthLayout() {
  const { t } = useTranslation(['auth', 'common']);

  const trustIndicators = [
    { icon: Lock, key: 'trust.encryption' },
    { icon: Shield, key: 'trust.protection' },
    { icon: CheckCircle2, key: 'trust.compliant' },
  ];

  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-2">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* LEFT PANEL - FORM AREA */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="flex flex-col">
        {/* Mobile Logo Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-6 lg:hidden">
          <Link 
            to="/" 
            className="transition-opacity hover:opacity-80"
            aria-label="Return to home"
          >
            <Logo />
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md animate-fade-in">
            {/* Desktop Logo - Above Form */}
            <div className="mb-8 hidden lg:block">
              <Link 
                to="/" 
                className="inline-block transition-opacity hover:opacity-80"
                aria-label="Return to home"
              >
                <Logo />
              </Link>
            </div>

            {/* Form Content (Outlet) */}
            <Outlet />

            {/* Footer Links */}
            <div className="mt-8 border-t border-neutral-200 pt-6 text-center text-sm text-text-muted">
              <p>
                {t('auth:footer_text', 'Protected by bank-grade security')}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
                <Link 
                  to="/privacy-policy" 
                  className="transition-colors hover:text-primary"
                >
                  {t('auth:privacy_link', 'Privacy Policy')}
                </Link>
                <span>•</span>
                <Link 
                  to="/terms-of-service" 
                  className="transition-colors hover:text-primary"
                >
                  {t('auth:terms_link', 'Terms of Service')}
                </Link>
                <span>•</span>
                <Link 
                  to="/security" 
                  className="transition-colors hover:text-primary"
                >
                  {t('auth:security_link', 'Security')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* RIGHT PANEL - BRAND & TRUST BUILDING */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="relative hidden overflow-hidden border-l border-neutral-200 bg-gradient-to-br from-background-subtle via-background-subtle to-primary/10 lg:flex lg:flex-col">
        
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(107, 142, 35) 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }}></div>
        </div>

        {/* Top Logo (Desktop) */}
        <div className="relative flex h-20 items-center border-b border-neutral-200/50 px-12">
          <Link 
            to="/" 
            className="transition-opacity hover:opacity-80"
            aria-label="Return to home"
          >
            <Logo />
          </Link>
        </div>

        {/* Main Content - Centered */}
        <div className="relative flex flex-1 flex-col items-center justify-center p-12 text-center">
          
          {/* Hero Visual */}
          <div className="mb-12 flex h-72 w-72 items-center justify-center rounded-full border-4 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-elegant">
            <div className="text-center">
              <div className="mb-4 text-8xl">🏞️</div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-serif text-lg font-semibold text-primary">
                  {t('auth:badge', 'Secure Access')}
                </span>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl font-bold tracking-tight text-text">
            {t('auth:layout_title', 'Protect Your Family\'s Legacy')}
          </h1>
          
          {/* Subheadline */}
          <p className="mt-6 max-w-md text-lg leading-relaxed text-text-subtle">
            {t('auth:layout_subtitle', 'Join thousands of Kenyan families securing their land inheritance with confidence and peace of mind.')}
          </p>

          {/* Trust Indicators */}
          <div className="mt-12 grid w-full max-w-lg gap-4">
            {trustIndicators.map((indicator, index) => (
              <div 
                key={indicator.key}
                className="flex items-center gap-4 rounded-elegant border border-neutral-200 bg-background/80 p-4 shadow-soft backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lifted"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                  <indicator.icon className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-left text-sm font-medium text-text">
                  {t(`auth:${indicator.key}`, {
                    defaultValue: 'Security feature'
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-neutral-200 pt-8">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">10K+</div>
              <p className="mt-1 text-xs text-text-muted">
                {t('auth:stat_families', 'Families Protected')}
              </p>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-secondary">100%</div>
              <p className="mt-1 text-xs text-text-muted">
                {t('auth:stat_secure', 'Secure Platform')}
              </p>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">24/7</div>
              <p className="mt-1 text-xs text-text-muted">
                {t('auth:stat_support', 'Support Available')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Testimonial Quote */}
        <div className="relative border-t border-neutral-200/50 p-8">
          <blockquote className="text-center">
            <p className="font-serif text-base italic leading-relaxed text-text-subtle">
              "{t('auth:testimonial', 'Shamba Sure gave me peace knowing my children won\'t fight over our land. The process was simple and secure.')}"
            </p>
            <footer className="mt-3 text-sm font-semibold text-text">
              {t('auth:testimonial_author', '— Grace M., Nakuru County')}
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
