// FILE: src/pages/public/AboutPage.tsx (New & Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Target, HeartHandshake } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function AboutPage() {
  const { t } = useTranslation('public');
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary/5 py-20 text-center">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{t('about:hero_title', 'Our Mission: Empowering Kenyan Families')}</h1>
          <p className="mt-6 text-xl text-muted-foreground">
            {t('about:hero_subtitle', 'We are dedicated to making succession planning simple, secure, and accessible for everyone, preventing land disputes and protecting family legacies.')}
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-8">{t('about:story_title', 'The Shamba Sure Story')}</h2>
          <div className="prose prose-lg mx-auto text-muted-foreground">
            <p>{t('about:story_p1', 'Founded by a team of legal, tech, and land management experts, Shamba Sure was born from a shared vision: to solve one of Kenya’s most pressing challenges – land inheritance disputes. We saw countless families torn apart and legacies lost due to unclear wills and complex legal processes.')}</p>
            <p>{t('about:story_p2', 'We believed technology could provide a better way. By combining legal expertise with a user-friendly digital platform, we created a solution that puts the power of estate planning directly into your hands.')}</p>
          </div>
        </div>
      </section>
      
      {/* Our Values Section */}
      <section className="bg-muted/50 py-20 border-t">
         <div className="container max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">{t('about:values_title', 'Our Core Values')}</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">{t('about:value1_title', 'Security')}</h3>
                <p className="mt-2 text-muted-foreground">{t('about:value1_desc', 'Your data and your legacy are protected with the highest standards of digital security.')}</p>
              </div>
              <div className="text-center">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">{t('about:value2_title', 'Accessibility')}</h3>
                <p className="mt-2 text-muted-foreground">{t('about:value2_desc', 'We make complex legal tools simple and available to everyone, on any device.')}</p>
              </div>
              <div className="text-center">
                <HeartHandshake className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">{t('about:value3_title', 'Trust')}</h3>
                <p className="mt-2 text-muted-foreground">{t('about:value3_desc', 'We are committed to transparency and ethical practices in everything we do.')}</p>
              </div>
            </div>
         </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-24 text-center">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">{t('about:cta_title', 'Join Us in Securing Legacies')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('about:cta_desc', 'Become part of a community dedicated to building a more secure future for Kenyan families.')}</p>
          <Button size="lg" onClick={() => navigate('/register')} className="mt-8">{t('common:get_started')}</Button>
        </div>
      </section>
    </div>
  );
}