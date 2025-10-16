// FILE: src/pages/public/FeaturesPage.tsx

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
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * The public-facing "Features" page, detailing the core and additional
 * functionalities of the Shamba Sure platform.
 */
export function FeaturesPage() {
  const { t } = useTranslation(['features', 'common']);
  const navigate = useNavigate();

  const mainFeatures = React.useMemo(() => [
    { icon: FileText, titleKey: 'main_features.will_creation.title', descriptionKey: 'main_features.will_creation.description', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Building2, titleKey: 'main_features.asset_management.title', descriptionKey: 'main_features.asset_management.description', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { icon: Users, titleKey: 'main_features.family_tree.title', descriptionKey: 'main_features.family_tree.description', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Lock, titleKey: 'main_features.document_vault.title', descriptionKey: 'main_features.document_vault.description', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  ], []);

  const additionalFeatures = React.useMemo(() => [
    'additional_features.item1', 'additional_features.item2', 'additional_features.item3',
    'additional_features.item4', 'additional_features.item5', 'additional_features.item6',
    'additional_features.item7', 'additional_features.item8', 'additional_features.item9',
  ], []);
  
  const platformHighlights = React.useMemo(() => [
      { icon: Smartphone, titleKey: 'highlights.mobile_first.title', descriptionKey: 'highlights.mobile_first.description', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { icon: Shield, titleKey: 'highlights.security.title', descriptionKey: 'highlights.security.description', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
      { icon: Globe, titleKey: 'highlights.language.title', descriptionKey: 'highlights.language.description', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ], []);

  return (
    <div className="bg-background">
      {/* --- Hero Section --- */}
      <section className="border-b bg-muted/40 py-24">
        <div className="container max-w-5xl text-center">
          <Badge variant="outline" className="mb-4">{t('hero.badge')}</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t('hero.title')}
            <span className="block text-primary">{t('hero.subtitle')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t('hero.description')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')}>{t('common:get_started')}</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>{t('hero.contact_us')}</Button>
          </div>
        </div>
      </section>

      {/* --- Main Features --- */}
      <section className="py-20">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('main_features.title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t('main_features.description')}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {mainFeatures.map((feature) => (
              <FeatureCard key={feature.titleKey} icon={feature.icon} title={t(feature.titleKey)} description={t(feature.descriptionKey)} color={feature.color} bgColor={feature.bgColor} />
            ))}
          </div>
        </div>
      </section>

      {/* --- Additional Features --- */}
      <section className="border-t bg-muted/40 py-20">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('additional_features.title')}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t('additional_features.description')}</p>
          </div>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((featureKey) => (
              <CheckListItem key={featureKey} text={t(featureKey)} />
            ))}
          </div>
        </div>
      </section>

       {/* --- Platform Highlights --- */}
       <section className="py-20">
        <div className="container max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {platformHighlights.map(highlight => (
                <HighlightCard key={highlight.titleKey} icon={highlight.icon} title={t(highlight.titleKey)} description={t(highlight.descriptionKey)} color={highlight.color} bgColor={highlight.bgColor}/>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="border-t bg-muted/40 py-24">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('cta.description')}</p>
          <div className="mt-8">
            <Button size="lg" onClick={() => navigate('/register')}>
              {t('common:get_started')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface FeatureCardProps { icon: React.ElementType; title: string; description: string; color: string; bgColor: string; }
function FeatureCard({ icon: Icon, title, description, color, bgColor }: FeatureCardProps) {
  return (
    <div className="text-center">
      <div className={`mx-auto inline-flex rounded-lg ${bgColor} p-3 mb-4`}><Icon className={`h-6 w-6 ${color}`} /></div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

interface CheckListItemProps { text: string; }
function CheckListItem({ text }: CheckListItemProps) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

interface HighlightCardProps { icon: React.ElementType; title: string; description: string; color: string; bgColor: string; }
function HighlightCard({ icon: Icon, title, description, color, bgColor }: HighlightCardProps) {
    return (
        <Card>
            <CardContent className="p-6 text-center">
                <div className={`inline-flex rounded-lg ${bgColor} p-3 mb-4`}><Icon className={`h-8 w-8 ${color}`} /></div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}
