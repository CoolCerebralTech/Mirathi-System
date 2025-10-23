// FILE: src/pages/public/SecurityPage.tsx
// VERSION 3: Old Money Refined - Trust & Security Showcase (Finalized)

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Lock, 
  ShieldCheck, 
  FileLock2, 
  LifeBuoy, 
  Fingerprint,
  Award,
  Eye,
  Server,
  FileCheck,
  CheckCircle2,
  Shield,
  ArrowRight,
  type LucideIcon
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/Accordion';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface SecurityFeatureProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  color: 'primary' | 'secondary' | 'accent-burgundy';
  index: number;
}

interface ComplianceBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

// Security features data
const securityFeaturesData = [
  { 
    icon: Lock, 
    id: 'encryption',
    color: 'primary' as const,
  },
  { 
    icon: Server, 
    id: 'infrastructure',
    color: 'accent-burgundy' as const,
  },
  { 
    icon: Fingerprint, 
    id: 'access_control',
    color: 'secondary' as const,
  },
  { 
    icon: FileLock2, 
    id: 'data_privacy',
    color: 'primary' as const,
  },
  { 
    icon: ShieldCheck, 
    id: 'audits',
    color: 'accent-burgundy' as const,
  },
  { 
    icon: LifeBuoy, 
    id: 'support',
    color: 'secondary' as const,
  },
];

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function SecurityPage() {
  const { t } = useTranslation(['security']); 
  const navigate = useNavigate();

  const complianceBadges = React.useMemo(() => [
    { icon: Award, titleKey: 'compliance.kdpa.title', descriptionKey: 'compliance.kdpa.description' },
    { icon: Shield, titleKey: 'compliance.iso.title', descriptionKey: 'compliance.iso.description' },
    { icon: FileCheck, titleKey: 'compliance.legal.title', descriptionKey: 'compliance.legal.description' },
    { icon: Server, titleKey: 'compliance.backup.title', descriptionKey: 'compliance.backup.description' },
  ], []);
  
  const curatedFaqs = React.useMemo(() => [
    { 
      qKey: 'faq.q1', 
      aKey: 'faq.a1',
      question: 'Can Shamba Sure employees see my documents?',
      answer: 'No. Absolutely not. Your documents are protected with end-to-end encryption from the moment they leave your device. Think of your Shamba Sure vault as a personal safety deposit box where only you hold the key. Our system is designed so that no employee, under any circumstances, can access or view your unencrypted files. Your privacy is paramount and non-negotiable.'
    },
    { 
      qKey: 'faq.q2', 
      aKey: 'faq.a2',
      question: 'Where is my data stored and is it protected by Kenyan law?',
      answer: 'Yes. All your data is securely stored on world-class cloud servers with redundant backups. Crucially, we are a Kenyan company fully compliant with the Kenya Data Protection Act (KDPA). This means your information is governed and protected by Kenyan law, ensuring your data rights are always upheld. We operate under the same legal safeguards you trust every day.'
    },
    { 
      qKey: 'faq.q3', 
      aKey: 'faq.a3',
      question: 'What happens if I pass away or lose access to my account?',
      answer: 'This is the core reason Shamba Sure exists. Our platform is designed for a secure and seamless transfer of information. You can designate "Trusted Contacts" who, upon your passing and after a secure verification process, can be granted controlled access to specific documents according to your wishes. This ensures your legacy is passed on smoothly and securely, exactly as you planned, without the chaos of lost passwords or inaccessible files.'
    },
  ], []);

  const securityPromises = React.useMemo(() => [
    'promises.no_selling',
    'promises.full_control',
    'promises.transparent',
    'promises.kenyan_law',
  ], []);

  return (
    <div className="bg-background font-sans text-text">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Trust-First Messaging */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-background via-background-subtle to-secondary/5">
        {/* Decorative shield pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10 L40 20 L40 35 L30 45 L20 35 L20 20 Z' fill='%236B8E23' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="container relative mx-auto px-6 py-20 sm:py-28 lg:px-8">
          
          {/* Main Content */}
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 border-secondary/30 bg-secondary/10 px-4 py-1.5 font-serif text-sm font-medium text-secondary shadow-soft">
              {t('hero.badge', 'Bank-Grade Protection')}
            </Badge>
            
            <h1 className="font-display text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
              {t('hero.title', 'Your Trust is')}
              <span className="mt-2 block text-secondary">
                {t('hero.title_accent', 'Our Foundation')}
              </span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-text-subtle sm:text-xl">
              {t('hero.description', 'When you entrust us with your family\'s most important documents, we take that responsibility seriously. Every security measure we implement is designed to protect your legacy and earn your confidence.')}
            </p>
          </div>

          {/* Trust Indicators - "Foundation Plinth" */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="animate-slide-up rounded-elegant border border-neutral-200/70 bg-background/80 p-8 shadow-soft backdrop-blur-sm" style={{ animationDelay: '300ms' }}>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0 rounded-full bg-secondary/10 p-3">
                    <ShieldCheck className="h-7 w-7 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-text">256-Bit Encryption</h3>
                    <p className="text-sm text-text-subtle">Military-Grade Protection</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0 rounded-full bg-secondary/10 p-3">
                    <Award className="h-7 w-7 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-text">KDPA Certified</h3>
                    <p className="text-sm text-text-subtle">Fully Compliant</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0 rounded-full bg-secondary/10 p-3">
                    <Eye className="h-7 w-7 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-text">24/7 Monitoring</h3>
                    <p className="text-sm text-text-subtle">Always Protected</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SECURITY FEATURES - "The Security Dossier" */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-secondary">
              {t('features.eyebrow', 'Multi-Layered Protection')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
              {t('features.title', 'Security at Every Level')}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-text-subtle">
              {t('features.description', 'We\'ve implemented comprehensive security measures across infrastructure, data, and access control to ensure your documents remain safe, private, and under your control.')}
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-6xl gap-8 md:grid-cols-2">
            {securityFeaturesData.map((feature, index) => (
              <SecurityFeatureCard
                key={feature.id}
                icon={feature.icon}
                title={t(`features.${feature.id}.title`, feature.id)}
                description={t(`features.${feature.id}.description`, 'Description')}
                badge={t(`features.${feature.id}.badge`, 'Badge')}
                color={feature.color}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* COMPLIANCE SECTION - "Official Seals of Trust" */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-neutral-200 bg-background-subtle py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-primary">
              {t('compliance.eyebrow', 'Certifications & Standards')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
              {t('compliance.title', 'Compliance You Can Trust')}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-text-subtle">
              {t('compliance.description', 'We adhere to the highest industry standards and Kenyan regulations to ensure your data is handled with the utmost care and legal compliance.')}
            </p>
          </div>

          <div className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {complianceBadges.map((badge, index) => (
              <ComplianceBadge
                key={badge.titleKey}
                icon={badge.icon}
                title={t(badge.titleKey, 'Title')}
                description={t(badge.descriptionKey, 'Description')}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* OUR PROMISES - "Charter of Trust" */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-secondary">
              {t('promises.eyebrow', 'Our Commitment')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
              {t('promises.title', 'What We Promise You')}
            </h2>
            <p className="mx-auto mt-6 text-lg leading-relaxed text-text-subtle">
              {t('promises.description', 'These are not just features; they are our foundational commitments to you and your family. Your trust is sacred, and we will always act to protect it.')}
            </p>
          </div>

          {/* Unified Charter Grid */}
          <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-elegant border border-neutral-200 bg-background shadow-soft">
            <div className="grid divide-y divide-neutral-200 md:grid-cols-2 md:divide-x md:divide-y-0">
              {securityPromises.map((promiseKey, index) => (
                <div 
                  key={promiseKey} 
                  className="animate-fade-in p-8"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-secondary" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="mb-2 font-serif text-xl font-bold text-text">
                        {t(`${promiseKey}.title`, 'Promise Title')}
                      </h3>
                      <p className="text-sm leading-relaxed text-text-subtle">
                        {t(`${promiseKey}.description`, 'Promise description')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* CURATED Q&A SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-t border-neutral-200 bg-background-subtle py-20 lg:py-32">
        <div className="container mx-auto max-w-4xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-primary">
              {t('faq.eyebrow', 'Your Concerns Addressed')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
              {t('faq.title', 'Security Questions Answered')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle">
              {t('faq.description', 'Transparency builds trust. Here are answers to the most critical security and privacy questions.')}
            </p>
          </div>
          
          <div className="mt-16 w-full">
            <Accordion type="single" collapsible className="space-y-4">
              {curatedFaqs.map((faq, index) => (
                <AccordionItem 
                  key={`faq-${index}`}
                  value={`faq-item-${index}`}
                  className="animate-fade-in rounded-elegant border border-neutral-200 bg-background shadow-subtle transition-all duration-300 hover:border-primary/30 hover:shadow-soft"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <AccordionTrigger>
                    {t(faq.qKey, faq.question)}
                  </AccordionTrigger>
                  <AccordionContent>
                    {t(faq.aKey, faq.answer)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* View All CTA */}
          <div className="mt-12 text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/help')} 
              className="group border-2 border-neutral-300 font-medium transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              {t('faq.view_all', 'Visit our Help Center for More FAQs')}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SECURITY FEATURE CARD - "The Dossier Entry"
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function SecurityFeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  badge,
  color,
  index
}: SecurityFeatureProps) {
  const colorVariants = {
    primary: {
      header: 'bg-primary/10 border-primary/20',
      icon: 'text-primary',
      badge: 'bg-primary/10 text-primary border-primary/20'
    },
    secondary: {
      header: 'bg-secondary/10 border-secondary/20',
      icon: 'text-secondary',
      badge: 'bg-secondary/10 text-secondary border-secondary/20'
    },
    'accent-burgundy': {
      header: 'bg-accent-burgundy/10 border-accent-burgundy/20',
      icon: 'text-accent-burgundy',
      badge: 'bg-accent-burgundy/10 text-accent-burgundy border-accent-burgundy/20'
    }
  };

  const selectedColor = colorVariants[color];

  return (
    <div 
      className="group animate-fade-in flex flex-col overflow-hidden rounded-elegant border border-neutral-200 bg-background shadow-soft transition-all duration-300 hover:border-neutral-300 hover:shadow-lifted"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Header with icon and badge */}
      <div className={`flex items-center gap-4 border-b border-neutral-200 p-6 ${selectedColor.header}`}>
        <div className="flex-shrink-0 rounded-lg p-3">
          <Icon className={`h-7 w-7 ${selectedColor.icon}`} />
        </div>
        <div>
          <Badge className={`mb-1 w-fit border text-xs font-medium ${selectedColor.badge}`}>
            {badge}
          </Badge>
          <h3 className="font-serif text-lg font-bold text-text">
            {title}
          </h3>
        </div>
      </div>
      
      {/* Body with description */}
      <div className="flex-grow p-6">
        <p className="text-sm leading-relaxed text-text-subtle">
          {description}
        </p>
      </div>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPLIANCE BADGE COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function ComplianceBadge({ 
  icon: Icon, 
  title, 
  description,
  index
}: ComplianceBadgeProps) {
  return (
    <div 
      className="group animate-fade-in rounded-elegant bg-background p-8 text-center shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lifted"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Embossed Icon Circle */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 shadow-inner">
        <Icon className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
      </div>
      <h3 className="mb-2 font-serif text-lg font-bold text-text">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-text-subtle">
        {description}
      </p>
    </div>
  );
}
