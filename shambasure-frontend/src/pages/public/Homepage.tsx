// FILE: src/pages/public/HomePage.tsx (New & Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Users, ArrowRight } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export function HomePage() {
  const { t } = useTranslation(['public', 'common']);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-grow flex items-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-6xl py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            {t('home:hero_title', 'Secure Your Family’s Future')}
            <span className="block text-primary">{t('home:hero_subtitle', 'Digital Succession Planning for Kenya')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground">
            {t('home:hero_description', 'Easily create a legally-sound will, manage your assets, and protect your legacy. Shamba Sure makes estate planning simple, secure, and accessible for every Kenyan family.')}
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')} className="gap-2">
              {t('common:get_started_free')}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/features')}>
              {t('common:explore_features')}
            </Button>
          </div>
        </div>
      </section>

      {/* Core Pillars Section */}
      <section className="py-20 border-t">
        <div className="container max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">{t('home:pillar1_title', 'Create Your Will')}</h3>
              <p className="mt-2 text-muted-foreground">{t('home:pillar1_desc', 'Our guided process helps you create a comprehensive will in minutes.')}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold">{t('home:pillar2_title', 'Manage Your Assets')}</h3>
              <p className="mt-2 text-muted-foreground">{t('home:pillar2_desc', 'A secure digital vault for all your land, property, and financial assets.')}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">{t('home:pillar3_title', 'Protect Your Heirs')}</h3>
              <p className="mt-2 text-muted-foreground">{t('home:pillar3_desc', 'Clearly define beneficiaries and ensure a smooth inheritance process.')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof / Testimonials (Placeholder) */}
      <section className="py-20 bg-muted/50 border-t">
        <div className="container max-w-4xl text-center">
             <h2 className="text-3xl font-bold tracking-tight">{t('home:testimonials_title', 'Trusted by Families Across Kenya')}</h2>
             <p className="mt-4 text-lg text-muted-foreground">{t('home:testimonials_quote', '"Shamba Sure gave me peace of mind. I finally have a clear plan for my children\'s future." - A. Kamau, Nakuru')}</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t">
          <div className="container max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('home:cta_title', 'Ready to Protect Your Legacy?')}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{t('home:cta_desc', 'Take the first step towards securing your family’s future today.')}</p>
              <Button size="lg" onClick={() => navigate('/register')} className="mt-8">
                  {t('common:create_your_will_now')}
              </Button>
          </div>
      </section>
    </div>
  );
}