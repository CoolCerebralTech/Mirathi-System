// FILE: src/pages/public/AboutPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Target, HeartHandshake } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface ValueCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * The public-facing "About Us" page, detailing the mission, story, and values of Shamba Sure.
 */
export function AboutPage() {
  const { t } = useTranslation(['about', 'common']);
  const navigate = useNavigate();

  const values = [
    { icon: ShieldCheck, titleKey: 'values.security_title', descriptionKey: 'values.security_desc' },
    { icon: Target, titleKey: 'values.accessibility_title', descriptionKey: 'values.accessibility_desc' },
    { icon: HeartHandshake, titleKey: 'values.trust_title', descriptionKey: 'values.trust_desc' },
  ];

  return (
    <div>
      {/* --- Hero Section --- */}
      <section className="bg-primary/5 py-24 text-center">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t('hero.title')}</h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{t('hero.subtitle')}</p>
        </div>
      </section>

      {/* --- Our Story Section --- */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12 sm:text-4xl">{t('story.title')}</h2>
          <div className="prose prose-lg mx-auto max-w-none text-muted-foreground space-y-6">
            <p>{t('story.p1')}</p>
            <p>{t('story.p2')}</p>
          </div>
        </div>
      </section>
      
      {/* --- Our Values Section --- */}
      <section className="bg-muted/40 py-20 border-t">
         <div className="container max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-12 sm:text-4xl">{t('values.title')}</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {values.map((value) => (
                <ValueCard
                  key={value.titleKey}
                  icon={value.icon}
                  title={t(value.titleKey)}
                  description={t(value.descriptionKey)}
                />
              ))}
            </div>
         </div>
      </section>

      {/* --- Join Us CTA --- */}
      <section className="py-24 text-center">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('cta.description')}</p>
          <Button size="lg" onClick={() => navigate('/register')} className="mt-8">
            {t('common:get_started', 'Get Started')}
          </Button>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT FOR VALUE CARD
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function ValueCard({ icon: Icon, title, description }: ValueCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background mb-4 border">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
