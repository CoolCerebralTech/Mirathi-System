// FILE: src/pages/public/FeaturesPage.tsx
// VERSION 2: Redesigned with the "Old Money" Premium Design System

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
  Landmark, // New icon for variety
  Scale,    // New icon for variety
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card'; // Importing more from Card
import { Badge } from '../../components/ui/Badge';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function FeaturesPage() {
  const { t } = useTranslation(['features', 'common']);
  const navigate = useNavigate();

  // Re-themed to use our brand colors and added more diverse icons
  const mainFeatures = React.useMemo(() => [
    { icon: FileText, titleKey: 'main_features.will_creation.title', descriptionKey: 'main_features.will_creation.description' },
    { icon: Building2, titleKey: 'main_features.asset_management.title', descriptionKey: 'main_features.asset_management.description' },
    { icon: Users, titleKey: 'main_features.family_tree.title', descriptionKey: 'main_features.family_tree.description' },
    { icon: Lock, titleKey: 'main_features.document_vault.title', descriptionKey: 'main_features.document_vault.description' },
  ], []);

  const additionalFeatures = React.useMemo(() => [
    'additional_features.item1', 'additional_features.item2', 'additional_features.item3',
    'additional_features.item4', 'additional_features.item5', 'additional_features.item6',
    'additional_features.item7', 'additional_features.item8', 'additional_features.item9',
  ], []);
  
  // Re-themed and expanded for a richer presentation
  const platformHighlights = React.useMemo(() => [
      { icon: Smartphone, titleKey: 'highlights.mobile_first.title', descriptionKey: 'highlights.mobile_first.description' },
      { icon: Shield, titleKey: 'highlights.security.title', descriptionKey: 'highlights.security.description' },
      { icon: Globe, titleKey: 'highlights.language.title', descriptionKey: 'highlights.language.description' },
      { icon: Landmark, titleKey: 'highlights.compliance.title', descriptionKey: 'highlights.compliance.description' },
      { icon: Scale, titleKey: 'highlights.mediation.title', descriptionKey: 'highlights.mediation.description' },
      { icon: Users, titleKey: 'highlights.heir_access.title', descriptionKey: 'highlights.heir_access.description' },
  ], []);

  return (
    <div className="bg-background font-sans text-text animate-fade-in">
      {/* --- Hero Section --- */}
      <section className="border-b border-neutral-200 bg-background-subtle">
        <div className="container max-w-5xl py-24 text-center sm:py-32">
          <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">{t('hero.badge', 'Our Features')}</Badge>
          <h1 className="font-display text-display tracking-tight">
            {t('hero.title', 'Tools for Total Peace of Mind')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle">
            {t('hero.description', 'Explore the comprehensive suite of features designed to simplify land succession, protect your assets, and preserve family harmony.')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')} className="bg-primary text-primary-foreground shadow-soft hover:shadow-lifted">
              {t('common:get_started')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')} className="border-neutral-300 bg-background hover:border-primary hover:text-primary">
              {t('hero.contact_us', 'Contact Sales')}
            </Button>
          </div>
        </div>
      </section>

      {/* --- Main Features --- */}
      <section className="py-20 lg:py-28">
        <div className="container max-w-7xl">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{t('main_features.title', 'Your Succession Operating System')}</h2>
            <p className="mt-4 text-lg text-text-subtle">{t('main_features.description', 'From initial planning to final transfer, Shamba Sure provides the tools you need at every step.')}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {mainFeatures.map((feature) => (
              <FeatureCard key={feature.titleKey} icon={feature.icon} title={t(feature.titleKey)} description={t(feature.descriptionKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* --- All-Inclusive Platform Section (Additional Features) --- */}
      <section className="border-y border-neutral-200 bg-background-subtle py-20 lg:py-28">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="lg:pr-12">
                <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{t('additional_features.title', 'An All-Inclusive Platform')}</h2>
                <p className="mt-4 text-lg text-text-subtle">{t('additional_features.description', 'We believe in providing full value. Our platform includes everything you need with no hidden costs.')}</p>
            </div>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {additionalFeatures.map((featureKey) => (
                <CheckListItem key={featureKey} text={t(featureKey)} />
                ))}
            </div>
        </div>
      </section>

       {/* --- Platform Highlights --- */}
       <section className="py-20 lg:py-28">
        <div className="container max-w-7xl">
            <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Designed for the Kenyan Family</h2>
                <p className="mt-4 text-lg text-text-subtle">Our platform is built with a deep understanding of the unique challenges and needs of land ownership in Kenya.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {platformHighlights.map(highlight => (
                    <HighlightCard key={highlight.titleKey} icon={highlight.icon} title={t(highlight.titleKey)} description={t(highlight.descriptionKey)} />
                ))}
            </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="border-t border-neutral-200 bg-background-subtle">
        <div className="container max-w-4xl py-24 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{t('cta.title', 'Ready to Secure Your Legacy?')}</h2>
          <p className="mt-4 text-lg text-text-subtle">{t('cta.description', 'Create your free account today and take the first step towards peace of mind for your family’s future.')}</p>
          <div className="mt-8">
            <Button size="lg" onClick={() => navigate('/register')} className="bg-primary text-primary-foreground shadow-soft hover:shadow-lifted">
              {t('common:get_started')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENTS (REDESIGNED)
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string; }) {
  return (
    <div className="text-center p-4">
      <div className="mx-auto inline-flex rounded-elegant bg-secondary/10 p-4 mb-5">
        <Icon className="h-8 w-8 text-secondary" />
      </div>
      <h3 className="font-serif text-xl font-bold mb-2">{title}</h3>
      <p className="text-text-subtle">{description}</p>
    </div>
  );
}

function CheckListItem({ text }: { text: string; }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary mt-1" />
      <span className="text-text-subtle">{text}</span>
    </div>
  );
}

function HighlightCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string; }) {
    return (
        <Card className="bg-background-elevated shadow-soft transition-all duration-300 hover:shadow-lifted hover:-translate-y-1">
            <CardHeader>
                <div className="inline-flex rounded-elegant bg-primary/10 p-3 mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="text-lg font-serif font-bold mb-2">{title}</h3>
                <p className="text-sm text-text-subtle">{description}</p>
            </CardContent>
        </Card>
    )
}
