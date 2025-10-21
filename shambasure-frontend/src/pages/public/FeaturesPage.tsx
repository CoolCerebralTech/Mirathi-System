// FILE: src/pages/public/FeaturesPage.tsx
// VERSION 2: Old Money Refined - Elegant Feature Showcase

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  Building2,
  Lock,
  CheckCircle2,
  Smartphone,
  Shield,
  Globe,
  ArrowRight,
  Landmark,
  Scale,
  Clock,
  Award,
  Bell,
  Fingerprint,
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function FeaturesPage() {
  const { t } = useTranslation(['features', 'common']);
  const navigate = useNavigate();

  // Core features with color coding for visual hierarchy
  const mainFeatures = React.useMemo(() => [
    { 
      icon: FileText, 
      titleKey: 'main_features.will_creation.title', 
      descriptionKey: 'main_features.will_creation.description',
      color: 'primary',
      stat: 'main_features.will_creation.stat'
    },
    { 
      icon: Building2, 
      titleKey: 'main_features.asset_management.title', 
      descriptionKey: 'main_features.asset_management.description',
      color: 'secondary',
      stat: 'main_features.asset_management.stat'
    },
    { 
      icon: Users, 
      titleKey: 'main_features.family_tree.title', 
      descriptionKey: 'main_features.family_tree.description',
      color: 'accent-burgundy',
      stat: 'main_features.family_tree.stat'
    },
    { 
      icon: Lock, 
      titleKey: 'main_features.document_vault.title', 
      descriptionKey: 'main_features.document_vault.description',
      color: 'primary',
      stat: 'main_features.document_vault.stat'
    },
  ], []);

  const additionalFeatures = React.useMemo(() => [
    { icon: Clock, key: 'additional_features.item1' },
    { icon: Bell, key: 'additional_features.item2' },
    { icon: Scale, key: 'additional_features.item3' },
    { icon: Shield, key: 'additional_features.item4' },
    { icon: Users, key: 'additional_features.item5' },
    { icon: FileText, key: 'additional_features.item6' },
    { icon: Award, key: 'additional_features.item7' },
    { icon: Fingerprint, key: 'additional_features.item8' },
    { icon: CheckCircle2, key: 'additional_features.item9' },
  ], []);
  
  const platformHighlights = React.useMemo(() => [
    { 
      icon: Smartphone, 
      titleKey: 'highlights.mobile_first.title', 
      descriptionKey: 'highlights.mobile_first.description',
      badge: 'highlights.mobile_first.badge'
    },
    { 
      icon: Shield, 
      titleKey: 'highlights.security.title', 
      descriptionKey: 'highlights.security.description',
      badge: 'highlights.security.badge'
    },
    { 
      icon: Globe, 
      titleKey: 'highlights.language.title', 
      descriptionKey: 'highlights.language.description',
      badge: 'highlights.language.badge'
    },
    { 
      icon: Landmark, 
      titleKey: 'highlights.compliance.title', 
      descriptionKey: 'highlights.compliance.description',
      badge: 'highlights.compliance.badge'
    },
    { 
      icon: Scale, 
      titleKey: 'highlights.mediation.title', 
      descriptionKey: 'highlights.mediation.description',
      badge: 'highlights.mediation.badge'
    },
    { 
      icon: Users, 
      titleKey: 'highlights.heir_access.title', 
      descriptionKey: 'highlights.heir_access.description',
      badge: 'highlights.heir_access.badge'
    },
  ], []);

  return (
    <div className="bg-background font-sans text-text">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Elegant Introduction */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-background to-background-subtle">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(184, 134, 11) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container relative max-w-5xl py-20 text-center sm:py-28">
          <Badge className="mb-6 border-primary/30 bg-primary/10 px-4 py-1.5 font-serif text-sm font-medium text-primary shadow-soft">
            {t('hero.badge', 'Comprehensive Platform')}
          </Badge>
          
          <h1 className="font-display text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
            {t('hero.title', 'Everything You Need for')}
            <span className="mt-2 block text-primary">
              {t('hero.title_accent', 'Peaceful Succession')}
            </span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-text-subtle sm:text-xl">
            {t('hero.description', 'From digital will creation to dispute prevention, Shamba Sure provides a complete ecosystem for securing your family\'s land legacy.')}
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')} 
              className="group w-full bg-primary text-lg font-semibold text-primary-foreground shadow-elegant transition-all duration-300 hover:bg-primary-hover hover:shadow-premium sm:w-auto"
            >
              {t('common:get_started', 'Get Started Free')}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/contact')} 
              className="w-full border-2 border-neutral-300 bg-background text-lg font-medium transition-all duration-300 hover:border-primary hover:bg-neutral-50 hover:text-primary sm:w-auto"
            >
              {t('hero.contact_us', 'Schedule Demo')}
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-text-subtle">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>{t('hero.trust.no_credit', 'No credit card required')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>{t('hero.trust.free_trial', 'Free forever for basic features')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>{t('hero.trust.setup', '5-minute setup')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* MAIN FEATURES SECTION - Core Value Props */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-7xl">
          <div className="mb-20 text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-secondary">
              {t('main_features.eyebrow', 'Core Capabilities')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
              {t('main_features.title', 'Your Succession Operating System')}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-text-subtle">
              {t('main_features.description', 'Four pillars of protection working together to secure your family\'s future and prevent disputes before they start.')}
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {mainFeatures.map((feature, index) => (
              <MainFeatureCard
                key={feature.titleKey}
                icon={feature.icon}
                title={t(feature.titleKey)}
                description={t(feature.descriptionKey)}
                stat={t(feature.stat)}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* DETAILED FEATURES SECTION - Two-Column Layout */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-neutral-200 bg-background-subtle py-20 lg:py-32">
        <div className="container max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            
            {/* Left: Content */}
            <div>
              <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-primary">
                {t('additional_features.eyebrow', 'Complete Toolkit')}
              </p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
                {t('additional_features.title', 'Every Feature You\'ll Ever Need')}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-subtle">
                {t('additional_features.description', 'We\'ve thought of everything. From document verification to family notifications, Shamba Sure is your all-in-one platform for land succession planning.')}
              </p>
              
              <div className="mt-8">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register')}
                  className="bg-primary text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-hover hover:shadow-lifted"
                >
                  {t('additional_features.cta', 'Explore All Features')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right: Feature Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {additionalFeatures.map((feature) => (
                <AdditionalFeatureItem
                  key={feature.key}
                  icon={feature.icon}
                  text={t(feature.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* PLATFORM HIGHLIGHTS - Cards Grid */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32">
        <div className="container max-w-7xl">
          <div className="mb-20 text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-secondary">
              {t('highlights.eyebrow', 'Built for Kenya')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
              {t('highlights.title', 'Designed for Kenyan Families')}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-text-subtle">
              {t('highlights.description', 'Every feature is crafted with deep understanding of Kenya\'s unique land ownership challenges, cultural dynamics, and legal framework.')}
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {platformHighlights.map((highlight) => (
              <HighlightCard
                key={highlight.titleKey}
                icon={highlight.icon}
                title={t(highlight.titleKey)}
                description={t(highlight.descriptionKey)}
                badge={t(highlight.badge)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FINAL CTA SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-t border-neutral-200 bg-gradient-to-b from-background-subtle to-background">
        <div className="container max-w-4xl py-24 text-center lg:py-32">
          <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl">
            {t('cta.title', 'Start Protecting Your Legacy Today')}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle sm:text-xl">
            {t('cta.description', 'Join thousands of Kenyan families who trust Shamba Sure to secure their land inheritance and preserve family harmony.')}
          </p>
          <div className="mt-10">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')} 
              className="group bg-primary px-10 py-6 text-xl font-semibold text-primary-foreground shadow-elegant transition-all duration-300 hover:bg-primary-hover hover:shadow-premium"
            >
              {t('common:get_started', 'Create Free Account')}
              <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          <p className="mt-6 text-sm text-text-muted">
            {t('cta.guarantee', 'No credit card • Free setup • Cancel anytime')}
          </p>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN FEATURE CARD - Large, Detailed Cards
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function MainFeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  stat,
  index 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  stat: string;
  index: number;
}) {
  return (
    <div 
      className="group relative overflow-hidden rounded-elegant border border-neutral-200 bg-background p-8 shadow-soft transition-all duration-500 hover:border-primary/30 hover:shadow-lifted"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Number badge */}
      <div className="absolute right-4 top-4 font-display text-6xl font-bold text-neutral-100">
        0{index + 1}
      </div>

      {/* Icon */}
      <div className="relative mb-6 inline-flex rounded-lg bg-primary/10 p-4 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
        <Icon className="h-8 w-8 text-primary" />
      </div>

      {/* Content */}
      <h3 className="relative mb-3 font-serif text-xl font-bold text-text">
        {title}
      </h3>
      <p className="relative mb-4 leading-relaxed text-text-subtle">
        {description}
      </p>

      {/* Stat */}
      <div className="relative mt-6 border-t border-neutral-200 pt-4">
        <p className="text-sm font-semibold text-primary">{stat}</p>
      </div>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// ADDITIONAL FEATURE ITEM - Compact with Icon
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function AdditionalFeatureItem({ 
  icon: Icon, 
  text 
}: { 
  icon: React.ElementType; 
  text: string; 
}) {
  return (
    <div className="group flex items-start gap-4 rounded-elegant bg-background p-4 shadow-subtle transition-all duration-300 hover:shadow-soft">
      <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2 transition-colors duration-300 group-hover:bg-primary/20">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="pt-0.5 text-sm font-medium text-text">{text}</span>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// HIGHLIGHT CARD - Elevated Cards with Badges
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function HighlightCard({ 
  icon: Icon, 
  title, 
  description, 
  badge 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  badge: string;
}) {
  return (
    <Card className="group overflow-hidden border-neutral-200 bg-background shadow-soft transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-lifted">
      <CardHeader className="pb-4">
        <div className="mb-4 inline-flex rounded-lg bg-secondary/10 p-4 transition-all duration-300 group-hover:bg-secondary/20">
          <Icon className="h-8 w-8 text-secondary" />
        </div>
        <Badge className="mb-2 w-fit border-secondary/30 bg-secondary/10 text-xs font-medium text-secondary">
          {badge}
        </Badge>
      </CardHeader>
      <CardContent>
        <h3 className="mb-3 font-serif text-lg font-bold text-text">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-text-subtle">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
