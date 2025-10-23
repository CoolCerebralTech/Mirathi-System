// FILE: src/pages/public/FeaturesPage.tsx
// VERSION 3: Old Money Refined - Interactive Feature Showcase

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  CheckCircle2,
  Smartphone,
  Shield,
  Globe,
  ArrowRight,
  Landmark,
  Scale,
  Clock,
  Lock,
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

import WillVisual from '../../assets/visual-will.png';
import FamilyVisual from '../../assets/visual-family.png';
import VaultVisual from '../../assets/visual-vault.png';
import MediationVisual from '../../assets/visual-mediation.png';
import TrackingVisual from '../../assets/visual-tracking.png';


// Data for interactive showcase section
const showcaseFeatures = [
  {
    id: 'will_creation',
    icon: FileText,
    visual: WillVisual,
  },
  {
    id: 'family_tree',
    icon: Users,
    visual: FamilyVisual,
  },
  {
    id: 'document_vault',
    icon: Lock,
    visual: VaultVisual,
  },
  {
    id: 'mediation_tools',
    icon: Scale,
    visual: MediationVisual,
  },
  {
    id: 'succession_tracking',
    icon: Clock,
    visual: TrackingVisual,
  },
];

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function FeaturesPage() {
  const { t } = useTranslation(['features', 'common']);
  const navigate = useNavigate();
  const [activeShowcase, setActiveShowcase] = React.useState(0);

  const platformHighlights = [
    { 
      icon: Smartphone, 
      id: 'mobile_first',
      color: 'primary' as const,
    },
    { 
      icon: Shield, 
      id: 'security', 
      color: 'accent-burgundy' as const,
    },
    { 
      icon: Globe, 
      id: 'language', 
      color: 'secondary' as const,
    },
    { 
      icon: Landmark, 
      id: 'compliance', 
      color: 'primary' as const,
    },
    { 
      icon: Scale, 
      id: 'mediation', 
      color: 'accent-burgundy' as const,
    },
    { 
      icon: Users, 
      id: 'heir_access', 
      color: 'secondary' as const,
    },
  ];

  return (
    <div className="bg-background font-sans text-text">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Split Screen with Floating Cards */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative overflow-hidden border-b border-neutral-200">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background-subtle to-primary/5"></div>
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(184, 134, 11) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container relative mx-auto px-6 lg:px-8">
          <div className="grid min-h-[80vh] items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
            
            {/* Left Column: Content */}
            <div className="animate-fade-in text-center lg:text-left">
              <Badge className="mb-6 border-primary/30 bg-primary/10 px-4 py-1.5 font-serif text-sm font-medium text-primary shadow-soft">
                {t('hero.badge', 'Comprehensive Platform')}
              </Badge>
              
              <h1 className="font-display text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
                {t('hero.title', 'Everything You Need for')}
                <span className="mt-2 block text-primary">
                  {t('hero.title_accent', 'Peaceful Succession')}
                </span>
              </h1>
              
              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-text-subtle sm:text-xl lg:mx-0">
                {t('hero.description', 'From digital will creation to dispute prevention, Shamba Sure provides a complete ecosystem for securing your family\'s land legacy.')}
              </p>
              
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                 <Button 
              size="lg" 
              onClick={() => navigate('/register')} 
              className="
                group w-full bg-primary text-lg font-semibold text-primary-foreground 
                shadow-elegant transition-all duration-300 
                hover:bg-primary-hover hover:shadow-premium hover:-translate-y-1
                p-0 sm:w-auto
              "
            >
              <div className="flex w-full items-center justify-between px-6 py-3 sm:w-auto">
                <span>{t('common:get_started', 'Get Started Free')}</span>
                
                {/* A more elegant chevron icon */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="ml-4 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/contact')} 
                  className="w-full border-2 border-neutral-300 text-lg font-medium transition-all duration-300 hover:border-primary hover:bg-neutral-50 hover:text-primary sm:w-auto"
                >
                  {t('hero.contact_us', 'Schedule Demo')}
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted lg:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  <span>{t('hero.trust.no_credit', 'No credit card required')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-secondary" />
                  <span>{t('hero.trust.free_trial', 'Free forever for basic features')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Floating Feature Cards */}
            <div className="relative hidden animate-fade-in lg:block" style={{ animationDelay: '200ms' }}>
              <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl"></div>
              <div className="relative space-y-4">
                
                {/* Card 1: Digital Will */}
                <div className="animate-slide-up rounded-elegant border border-neutral-200/50 bg-background/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-lifted" style={{ animationDelay: '300ms' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-text">Digital Will Creator</h3>
                      <p className="mt-1 text-sm text-text-subtle">Guided, legally compliant process</p>
                    </div>
                  </div>
                </div>
                
                {/* Card 2: Family Tree */}
                <div className="animate-slide-up translate-x-8 rounded-elegant border border-neutral-200/50 bg-background/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-lifted" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-secondary/10 p-3">
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-text">HeirLink™ Family Tree</h3>
                      <p className="mt-1 text-sm text-text-subtle">Visually assign heirs and assets</p>
                    </div>
                  </div>
                </div>
                
                {/* Card 3: Secure Vault */}
                <div className="animate-slide-up translate-x-4 rounded-elegant border border-neutral-200/50 bg-background/80 p-6 shadow-soft backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-lifted" style={{ animationDelay: '500ms' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-accent-burgundy/10 p-3">
                      <Shield className="h-6 w-6 text-accent-burgundy" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-text">Secure Document Vault</h3>
                      <p className="mt-1 text-sm text-text-subtle">Bank-grade encryption</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* INTERACTIVE SHOWCASE - Hover to Preview */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-neutral-200 bg-background-subtle py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-start gap-16 lg:grid-cols-2">
            
            {/* Left: Feature List */}
            <div className="lg:sticky lg:top-28">
              <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-primary">
                {t('showcase.eyebrow', 'Complete Toolkit')}
              </p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
                {t('showcase.title', 'A Powerful, Unified System')}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-subtle">
                {t('showcase.description', 'Each feature is designed to work seamlessly with the others, creating a single source of truth for your family\'s legacy.')}
              </p>
              
              <div className="mt-10 space-y-3">
                {showcaseFeatures.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveShowcase(index)}
                    onMouseEnter={() => setActiveShowcase(index)}
                    className={`
                      w-full cursor-pointer rounded-elegant border p-5 text-left transition-all duration-300
                      ${activeShowcase === index
                        ? 'border-primary/30 bg-background shadow-soft'
                        : 'border-transparent hover:bg-background/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        flex-shrink-0 rounded-lg p-3 transition-all duration-300
                        ${activeShowcase === index
                          ? 'scale-110 bg-primary/10'
                          : 'bg-neutral-200/50'
                        }
                      `}>
                        <feature.icon className={`h-6 w-6 transition-colors duration-300 ${
                          activeShowcase === index ? 'text-primary' : 'text-text-subtle'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-lg font-bold text-text">
                          {t(`showcase.${feature.id}.title`, feature.id)}
                        </h3>
                        <p className="mt-1 text-sm text-text-subtle">
                          {t(`showcase.${feature.id}.description`, 'Feature description')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Visual Preview */}
            <div className="relative h-[600px] overflow-hidden rounded-elegant border border-neutral-200 bg-neutral-100 shadow-lifted">
              {showcaseFeatures.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`
                    absolute inset-0 transition-all duration-700
                    ${activeShowcase === index 
                      ? 'z-10 opacity-100 scale-100' 
                      : 'z-0 opacity-0 scale-95'
                    }
                  `}
                >
                  <img
                    src={feature.visual}
                    alt={t(`showcase.${feature.id}.title`, feature.id)}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* PLATFORM HIGHLIGHTS - Trust Pillars */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
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
          
          <div className="mx-auto mt-20 grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {platformHighlights.map((highlight, index) => (
              <HighlightCard
                key={highlight.id}
                icon={highlight.icon}
                title={t(`highlights.${highlight.id}.title`, highlight.id)}
                description={t(`highlights.${highlight.id}.description`, 'Description')}
                badge={t(`highlights.${highlight.id}.badge`, 'Badge')}
                color={highlight.color}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FINAL CTA SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-t border-neutral-200 bg-gradient-to-b from-background-subtle to-background">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl">
              {t('cta.title', 'Start Protecting Your Legacy Today')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle sm:text-xl">
              {t('cta.description', 'Join thousands of Kenyan families who trust Shamba Sure to secure their land inheritance and preserve family harmony.')}
            </p>
            
            <div className="mt-12 flex justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="
                  group w-full max-w-md bg-primary text-lg font-semibold text-primary-foreground 
                  shadow-elegant transition-all duration-300 
                  hover:shadow-premium p-0 relative overflow-hidden sm:w-auto
                "
                style={{ lineHeight: '1' }}
              >
                <div className="flex items-center">
                  <span className="px-8 py-5">
                    {t('common:get_started', 'Create Free Account')}
                  </span>
                  <div className="
                    h-full self-stretch px-6 py-5 flex items-center 
                    bg-primary-hover transition-colors duration-300
                  ">
                    <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </Button>
            </div>

            <p className="mt-8 text-sm text-text-muted">
              {t('cta.guarantee', 'No credit card required • Free forever for basic features')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// HIGHLIGHT CARD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function HighlightCard({ 
  icon: Icon, 
  title, 
  description, 
  badge,
  color,
  index
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  badge: string;
  color: 'primary' | 'secondary' | 'accent-burgundy';
  index: number;
}) {
  const colorVariants = {
    primary: {
      iconContainer: 'bg-primary/10 group-hover:bg-primary/20',
      iconColor: 'text-primary',
      badge: 'border-primary/30 bg-primary/10 text-primary'
    },
    secondary: {
      iconContainer: 'bg-secondary/10 group-hover:bg-secondary/20',
      iconColor: 'text-secondary',
      badge: 'border-secondary/30 bg-secondary/10 text-secondary'
    },
    'accent-burgundy': {
      iconContainer: 'bg-accent-burgundy/10 group-hover:bg-accent-burgundy/20',
      iconColor: 'text-accent-burgundy',
      badge: 'border-accent-burgundy/30 bg-accent-burgundy/10 text-accent-burgundy'
    }
  };

  const selectedColor = colorVariants[color];

  return (
    <div 
      className="group animate-fade-in rounded-elegant border border-neutral-200 bg-background p-8 text-left shadow-soft transition-all duration-300 hover:-translate-y-2 hover:border-neutral-300 hover:shadow-lifted"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`mb-6 inline-flex rounded-xl p-4 transition-all duration-300 group-hover:scale-110 ${selectedColor.iconContainer}`}>
        <Icon className={`h-8 w-8 ${selectedColor.iconColor}`} />
      </div>
      <Badge className={`mb-3 w-fit text-xs font-medium ${selectedColor.badge}`}>
        {badge}
      </Badge>
      <h3 className="mb-3 font-serif text-xl font-bold text-text">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-text-subtle">
        {description}
      </p>
    </div>
  );
}
