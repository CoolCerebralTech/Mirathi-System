// FILE: src/pages/public/HomePage.tsx
// VERSION 2: Old Money Refined - Elegant, Emotional & Conversion-Optimized

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Users, ArrowRight, CheckCircle, TrendingUp, Heart } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import HeroImage from '../../assets/hero.jpg';
import TestimonialFamily from '../../assets/testimonial-family.jpg';
import TestimonialCouple from '../../assets/testimonial-couple.jpg';
import TestimonialProfessional from '../../assets/testimonial-professional.jpg';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const features = React.useMemo(() => [
    { 
      icon: FileText, 
      titleKey: 'pillars.will.title', 
      descriptionKey: 'pillars.will.description',
      color: 'primary'
    },
    { 
      icon: Users, 
      titleKey: 'pillars.heirs.title', 
      descriptionKey: 'pillars.heirs.description',
      color: 'secondary'
    },
    { 
      icon: Shield, 
      titleKey: 'pillars.assets.title', 
      descriptionKey: 'pillars.assets.description',
      color: 'accent-burgundy'
    },
  ], []);
  
  const testimonials = React.useMemo(() => [
    { 
      image: TestimonialFamily, 
      quoteKey: 'testimonials.quote_family', 
      attributionKey: 'testimonials.attribution_family',
      role: 'testimonials.role_family'
    },
    { 
      image: TestimonialCouple, 
      quoteKey: 'testimonials.quote_couple', 
      attributionKey: 'testimonials.attribution_couple',
      role: 'testimonials.role_couple'
    },
    { 
      image: TestimonialProfessional, 
      quoteKey: 'testimonials.quote_professional', 
      attributionKey: 'testimonials.attribution_professional',
      role: 'testimonials.role_professional'
    },
  ], []);

  const stats = React.useMemo(() => [
    { value: '26.2%', label: 'stats.succession_conflicts', icon: TrendingUp },
    { value: '38.6%', label: 'stats.land_loss', icon: Heart },
    { value: '10+', label: 'stats.court_years', icon: Shield },
  ], []);

  return (
    <div className="flex flex-col bg-background font-sans text-text">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Cinematic & Emotional */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section 
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ 
          backgroundImage: `url(${HeroImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed' // Parallax effect
        }}
      >
        {/* Elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        
        {/* Subtle vignette effect */}
        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.4)]"></div>
        
        <div className="relative z-10 px-4 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-white">
              {t('hero.badge', 'Trusted by 10,000+ Kenyan Families')}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            {t('hero.title', 'Preserve Your Legacy.')}
            <span className="mt-2 block text-primary-200">
              {t('hero.subtitle', 'Protect Your Family.')}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-8 max-w-3xl text-lg font-light leading-relaxed text-white/90 md:text-xl lg:text-2xl">
            {t('hero.description', 'End land disputes before they begin. Shamba Sure is the trusted digital platform helping Kenyan families secure inheritance, prevent conflict, and preserve generational wealth.')}
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')} 
              className="group w-full sm:w-auto bg-primary text-lg font-semibold text-primary-foreground shadow-elegant transition-all duration-300 hover:shadow-premium hover:-translate-y-1"
            >
              <div className="flex w-full items-center justify-between px-2"> {/* Added padding inside */}
                <span>{t('hero.cta_main', 'Start Protecting Your Legacy')}</span>
                
                {/* Using a Chevron for a more classic, elegant feel */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" // A slightly bolder stroke for presence
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
              onClick={() => navigate('/features')} 
              className="w-full border-2 border-white bg-transparent text-lg font-medium text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-text sm:w-auto"
            >
              {t('hero.cta_secondary', 'Explore Features')}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm">{t('hero.trust.secure', 'Bank-Level Security')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm">{t('hero.trust.compliant', 'KDPA Compliant')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-sm">{t('hero.trust.support', '24/7 Support')}</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-12 w-8 rounded-full border-2 border-white/30">
            <div className="mx-auto mt-2 h-2 w-2 animate-pulse rounded-full bg-white"></div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* PROBLEM STATS SECTION - Build Urgency */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-neutral-200 bg-background-subtle py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12"> 
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-display text-4xl font-bold text-text md:text-5xl">
              {t('stats.headline', 'The Land Inheritance Crisis in Kenya')}
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group rounded-elegant border border-neutral-200/50 bg-background p-8 text-center shadow-soft transition-all duration-300 hover:shadow-lifted hover:border-neutral-200"
                >
                <stat.icon className="mx-auto mb-6 h-12 w-12 text-primary/80 transition-transform group-hover:scale-110 group-hover:text-primary" />
                <div className="font-display text-6xl font-bold text-primary">{stat.value}</div>
                <p className="mt-4 text-sm font-medium text-text-subtle">
                  {t(stat.label)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-sm text-text-muted">
            {t('stats.source', 'Source: Kenya National Bureau of Statistics, 2024')}
          </p>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* KEY FEATURES SECTION - Solution */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-primary">
              {t('features.eyebrow', 'Comprehensive Solution')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text md:text-5xl">
              {t('features.headline', 'Everything You Need to Secure Your Land Legacy')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle">
              {t('features.subheadline', 'From digital will creation to dispute prevention, Shamba Sure provides the tools your family needs for peaceful succession.')}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.titleKey}
                icon={feature.icon}
                title={t(feature.titleKey)}
                description={t(feature.descriptionKey)}
                color={feature.color as 'primary' | 'secondary' | 'accent-burgundy'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SUCCESS STORIES SECTION - Social Proof */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-neutral-200 bg-background-subtle py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-secondary">
              {t('testimonials.eyebrow', 'Success Stories')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text md:text-5xl">
              {t('testimonials.headline', 'Trusted by Families Across Kenya')}
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.quoteKey}
                image={testimonial.image}
                quote={t(testimonial.quoteKey)}
                attribution={t(testimonial.attributionKey)}
                role={t(testimonial.role)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FINAL CTA SECTION - Conversion */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="bg-background py-24 lg:py-32">
        {/* 
          ACTION 1: Apply the "framing" layout for perfect balance.
        */}
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          {/* 
            ACTION 2: A tighter container for the content to make it feel focused.
          */}
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-text md:text-5xl lg:text-6xl">
              {t('cta.title', 'Your Family\'s Peace Starts Today')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle md:text-xl">
              {t('cta.description', 'Join thousands of Kenyan families who have secured their legacy and prevented disputes with Shamba Sure.')}
            </p>

            {/* 
              ACTION 3: Using our most premium "Two-Tone Reveal" button.
            */}
            <div className="mt-12 flex justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="group w-full max-w-md bg-primary text-lg font-semibold text-primary-foreground shadow-elegant transition-all duration-300 hover:shadow-premium p-0 relative overflow-hidden sm:w-auto"
                style={{ lineHeight: '1' }}
              >
                <div className="flex items-center">
                  <span className="px-8 py-5">
                    {t('cta.button', 'Get Started Free')}
                  </span>
                  <div className="h-full self-stretch px-6 py-5 flex items-center bg-primary-hover">
                    <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </Button>
            </div>

            <p className="mt-6 text-sm text-text-muted">
              {t('cta.guarantee', 'No credit card required • Free forever for basic features')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// FEATURE CARD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  color: 'primary' | 'secondary' | 'accent-burgundy'; 
}) {

  // Define color variants for reusability
  const colorVariants = {
    primary: 'text-primary bg-primary/10 hover:border-primary/30',
    secondary: 'text-secondary bg-secondary/10 hover:border-secondary/30',
    'accent-burgundy': 'text-accent-burgundy bg-accent-burgundy/10 hover:border-accent-burgundy/30',
  };

  return (
    // ACTION 4: Added a flex column structure to enable a "Learn More" link
    <div className={`group flex flex-col rounded-elegant border border-neutral-200 bg-background p-8 text-left shadow-soft transition-all duration-300 ${colorVariants[color]}`}>
      {/* ACTION 5: More prominent icon */}
      <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-xl transition-all duration-300 group-hover:bg-opacity-20 ${colorVariants[color].split(' ')[1]}`}>
        <Icon className={`h-8 w-8 ${colorVariants[color].split(' ')[0]}`} />
      </div>
      <h3 className="mb-3 font-serif text-xl font-bold text-text">{title}</h3>
      <p className="flex-grow leading-relaxed text-text-subtle">{description}</p>
      
      {/* ACTION 6: Added a subtle, elegant call-to-action */}
      <a href="#" className="mt-6 inline-flex items-center font-semibold text-text-subtle transition-colors duration-300 group-hover:text-text">
        Learn More
        <ArrowRight className="ml-2 h-4 w-4 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
      </a>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TESTIMONIAL CARD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function TestimonialCard({ 
  image, 
  quote, 
  attribution, 
  role 
}: { 
  image: string; 
  quote: string; 
  attribution: string; 
  role: string; 
}) {
  return (
    // ACTION 2: Changed background to a slightly elevated white for contrast
    <div className="group flex flex-col overflow-hidden rounded-elegant bg-background-elevated shadow-soft transition-all duration-300 hover:shadow-lifted">
      {/* ACTION 3: Added a subtle zoom-on-hover effect to the image */}
      <div className="relative h-80 w-full overflow-hidden">
        <img 
          src={image} 
          alt={attribution} 
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
        />
      </div>
      <div className="flex flex-1 flex-col p-8"> {/* Increased padding */}
        <blockquote className="relative flex flex-1 flex-col">
          {/* 
            ACTION 4: The key craftsmanship detail. A large, decorative quote mark.
            This gives the card a timeless, editorial feel.
          */}
          <span className="absolute -top-4 -left-3 font-display text-7xl text-neutral-100 z-0">
            “
          </span>
          <p className="relative z-10 mb-6 flex-1 font-serif text-lg leading-relaxed text-text">
            {quote}
          </p>
          <footer className="mt-auto border-t border-neutral-200 pt-5">
            <div className="font-sans text-base font-bold text-text">{attribution}</div>
            <div className="mt-1 font-sans text-sm text-text-muted">{role}</div>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
