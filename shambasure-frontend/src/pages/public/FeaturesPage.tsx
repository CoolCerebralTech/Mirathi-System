// FILE: src/pages/public/FeaturesPage.tsx

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  FileText, 
  Users, 
  Building2,
  Lock,
  CheckCircle2,
  Smartphone,
  Globe,
  ArrowRight
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

// ============================================================================
// FEATURES DATA
// ============================================================================

const mainFeatures = [
  {
    icon: FileText,
    title: 'Digital Will Creation',
    description: 'Create legally compliant wills with our step-by-step wizard. Assign heirs, define percentages, and ensure your wishes are documented.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: Building2,
    title: 'Asset Management',
    description: 'Organize and track all your assets including land, property, vehicles, and bank accounts in one secure digital vault.',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    icon: Users,
    title: 'Family Tree Integration',
    description: 'Build your family lineage, define relationships, and easily assign inheritance to family members with visual clarity.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    icon: Lock,
    title: 'Secure Document Vault',
    description: 'Upload, verify, and organize important documents with bank-level encryption. Track versions and maintain document history.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
];

const additionalFeatures = [
  'AI-powered fraud detection',
  'Blockchain document verification',
  'Multi-language support (English & Swahili)',
  'Mobile-first responsive design',
  'Automated beneficiary notifications',
  'Legal compliance tracking',
  'Dispute resolution tools',
  'Emergency access protocols',
  'Audit trail for all changes',
  'Role-based access control',
  'Document version history',
  'Offline document access',
];

// ============================================================================
// COMPONENT
// ============================================================================

export function FeaturesPage() {
  const { t } = useTranslation(['features', 'common']);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container max-w-6xl">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              {t('features:badge_text', 'Comprehensive Solution')}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t('features:hero_title', 'Everything You Need for')}
              <span className="block text-primary">
                {t('features:hero_subtitle', 'Digital Estate Planning')}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {t('features:hero_description', 'Shamba Sure provides a complete suite of tools to help you plan, protect, and preserve your legacy for future generations.')}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/register')}>
                {t('common:get_started')}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
                {t('common:contact_us')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('features:main_features_title', 'Core Features')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features:main_features_description', 'Powerful tools designed for comprehensive estate planning')}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className={`inline-flex rounded-lg ${feature.bgColor} p-3 mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('features:additional_title', 'Built with Security & Trust')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features:additional_description', 'Advanced features to ensure your data is safe and your legacy is protected')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Highlights */}
      <section className="py-20">
        <div className="container max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="inline-flex rounded-lg bg-blue-100 p-3 mb-4">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Mobile First</h3>
                <p className="text-sm text-muted-foreground">
                  Access your estate planning tools anywhere, anytime with our mobile-optimized platform
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="inline-flex rounded-lg bg-emerald-100 p-3 mb-4">
                  <Shield className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Bank-Level Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your sensitive data is protected with end-to-end encryption and advanced security protocols
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="inline-flex rounded-lg bg-purple-100 p-3 mb-4">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Local Language Support</h3>
                <p className="text-sm text-muted-foreground">
                  Use the platform in English or Swahili for better accessibility across Kenya
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary/5 py-20">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('features:cta_title', 'Ready to Secure Your Legacy?')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('features:cta_description', 'Join thousands of Kenyans who trust Shamba Sure with their estate planning')}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')} className="gap-2">
              {t('common:get_started')}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/about')}>
              {t('common:learn_more')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}