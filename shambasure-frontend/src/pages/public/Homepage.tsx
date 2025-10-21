// FILE: src/pages/public/HomePage.tsx
// FINAL VERSION: Combining Cinematic Hero + Clean & Modern Content Layout

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Users, ArrowRight } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import HeroImage from '../../assets/hero.jpg'; // Our cinematic hero image
import TestimonialFamily from '../../assets/testimonial-family.jpg'; // <-- Add this new image
import TestimonialCouple from '../../assets/testimonial-couple.jpg'; // <-- Add this new image
import TestimonialProfessional from '../../assets/testimonial-professional.jpg'; // <-- Add this new image

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  // Re-using the pillars data structure, it's perfect.
  const features = React.useMemo(() => [
    { icon: FileText, titleKey: 'pillars.will.title', descriptionKey: 'pillars.will.description' },
    { icon: Users, titleKey: 'pillars.heirs.title', descriptionKey: 'pillars.heirs.description' },
    { icon: Shield, titleKey: 'pillars.assets.title', descriptionKey: 'pillars.assets.description' },
  ], []);
  
  // New data structure for our testimonials, matching your images
  const testimonials = React.useMemo(() => [
      { image: TestimonialFamily, quoteKey: 'testimonials.quote_family', attributionKey: 'testimonials.attribution_family' },
      { image: TestimonialCouple, quoteKey: 'testimonials.quote_couple', attributionKey: 'testimonials.attribution_couple' },
      { image: TestimonialProfessional, quoteKey: 'testimonials.quote_professional', attributionKey: 'testimonials.attribution_professional' },
  ], []);

  return (
    <div className="flex flex-col bg-background font-sans text-text">
      {/* --- Hero Section (OUR CINEMATIC VERSION - UNCHANGED) --- */}
      <section 
        className="relative h-screen flex items-center justify-center text-center"
        style={{ backgroundImage: `url(${HeroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-white px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-4">
            {t('hero.title')} <span className="block">{t('hero.subtitle')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg md:text-xl font-light text-text-inverted/90">{t('hero.description')}</p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')} className="bg-primary text-primary-foreground hover:bg-primary-hover w-full sm:w-auto">
              {t('hero.cta_main')} <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/features')} className="border-2 border-white text-white hover:bg-white hover:text-text w-full sm:w-auto">
              {t('hero.cta_secondary')}
            </Button>
          </div>
        </div>
      </section>

      {/* --- Key Features Section (NEW CLEAN DESIGN) --- */}
      <section className="py-20 lg:py-28">
        <div className="container max-w-6xl">
            <div className="text-center mb-16">
                <p className="font-semibold text-primary mb-2">Key Features</p>
                <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight">Streamline Your Land Succession</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-text-subtle">
                  Shamba Sure offers a comprehensive suite of tools to help you manage your land inheritance effectively.
                </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.titleKey}
                  icon={feature.icon}
                  title={t(feature.titleKey)}
                  description={t(feature.descriptionKey)}
                />
              ))}
            </div>
        </div>
      </section>
      
      {/* --- Success Stories Section (NEW CLEAN DESIGN) --- */}
      <section className="py-20 lg:py-28 bg-background-subtle border-y border-neutral-light">
        <div className="container max-w-6xl">
             <div className="text-center mb-16">
                <p className="font-semibold text-primary mb-2">Success Stories</p>
                <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight">Trusted by Families Across Kenya</h2>
             </div>
             <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
                {testimonials.map((testimonial) => (
                    <div key={testimonial.quoteKey} className="flex flex-col items-center text-center">
                        <img src={testimonial.image} alt={t(testimonial.attributionKey)} className="w-full h-80 object-cover rounded-lg mb-6 shadow-md" />
                        <blockquote className="flex flex-col flex-grow">
                            <p className="text-lg text-text flex-grow">"{t(testimonial.quoteKey)}"</p>
                            <footer className="mt-4 font-semibold text-text-subtle">- {t(testimonial.attributionKey)}</footer>
                        </blockquote>
                    </div>
                ))}
             </div>
        </div>
      </section>

      {/* --- Final CTA Section (NEW CLEAN DESIGN) --- */}
      <section className="py-24 lg:py-32">
          <div className="container max-w-4xl text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-serif">{t('cta.title')}</h2>
              <p className="mt-4 text-lg text-text-subtle">{t('cta.description')}</p>
              <Button size="lg" onClick={() => navigate('/register')} className="mt-8 bg-primary text-primary-foreground hover:bg-primary-hover text-lg px-8 py-4">
                  {t('cta.button')}
              </Button>
          </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT (FOR FEATURES - NEW CLEAN DESIGN)
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-background p-8 border border-neutral-light rounded-xl text-left">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-5">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold font-serif mb-2">{title}</h3>
      <p className="text-text-subtle">{description}</p>
    </div>
  );
}
