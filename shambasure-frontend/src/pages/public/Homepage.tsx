// FILE: src/pages/public/HomePage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Users, ArrowRight } from 'lucide-react';

import { Button } from '../../components/ui/Button';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface PillarCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * The main public-facing homepage and landing page for the application.
 * Its goal is to communicate the value proposition and convert visitors into users.
 */
export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const pillars = React.useMemo(() => [
    { icon: FileText, titleKey: 'pillars.will.title', descriptionKey: 'pillars.will.description', iconBgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: Shield, titleKey: 'pillars.assets.title', descriptionKey: 'pillars.assets.description', iconBgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { icon: Users, titleKey: 'pillars.heirs.title', descriptionKey: 'pillars.heirs.description', iconBgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  ], []);

  return (
    <div className="flex flex-col">
      {/* --- Hero Section --- */}
      <section className="flex items-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-6xl py-24 text-center sm:py-32">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            {t('hero.title')}
            <span className="block text-primary">{t('hero.subtitle')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">{t('hero.description')}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')}>
              {t('hero.cta_main')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/features')}>
              {t('hero.cta_secondary')}
            </Button>
          </div>
        </div>
      </section>

      {/* --- Core Pillars Section --- */}
      <section className="py-20 border-t">
        <div className="container max-w-6xl">
          <div className="grid gap-10 md:grid-cols-3">
            {pillars.map((pillar) => (
              <PillarCard
                key={pillar.titleKey}
                icon={pillar.icon}
                title={t(pillar.titleKey)}
                description={t(pillar.descriptionKey)}
                iconBgColor={pillar.iconBgColor}
                iconColor={pillar.iconColor}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* --- Social Proof / Testimonials Section --- */}
      <section className="py-20 bg-muted/40 border-t">
        <div className="container max-w-4xl text-center">
             <h2 className="text-3xl font-bold tracking-tight">{t('testimonials.title')}</h2>
             <blockquote className="mt-6">
                <p className="text-xl italic text-muted-foreground">"{t('testimonials.quote')}"</p>
                <footer className="mt-4 font-semibold">{t('testimonials.attribution')}</footer>
             </blockquote>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-24 border-t">
          <div className="container max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{t('cta.description')}</p>
              <Button size="lg" onClick={() => navigate('/register')} className="mt-8">
                  {t('cta.button')}
              </Button>
          </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function PillarCard({ icon: Icon, title, description, iconBgColor, iconColor }: PillarCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBgColor} mb-4`}>
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
