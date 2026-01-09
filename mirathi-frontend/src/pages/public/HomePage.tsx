// FILE: src/pages/public/HomePage.tsx
// VERSION: Institutional Legal-Tech (Trust-First, Calm)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Lock, 
  Scale, 
  HeartHandshake,
  Building2
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

// Assets
import HeroImage from '@/assets/hero-mirathi-light.png';
import FamilyTreeViz from '@/assets/family-connections.png';
import EstateInventory from '@/assets/estate-dashboard.png';
import SuccessionRoadmap from '@/assets/succession-roadmap.png';

export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const features = React.useMemo(() => [
    { 
      icon: Users, 
      title: t('pillars.family.title', 'Establish Your Family Legacy Line'),
      description: t('pillars.family.description', 'Create a single, undisputed record of all legal heirs to prevent future disputes.'),
    },
    { 
      icon: Building2, 
      title: t('pillars.estate.title', 'Organize Your Complete Estate'),
      description: t('pillars.estate.description', 'Build a verified inventory of all assets for full transparency and accurate distribution.'),
    },
    { 
      icon: Scale, 
      title: t('pillars.succession.title', 'Navigate Legal Requirements Confidently'),
      description: t('pillars.succession.description', 'Step-by-step guidance and automated document preparation in full compliance with Kenyan law.'),
    },
  ], [t]);

  const challenges = React.useMemo(() => [
    { value: '7 in 10', label: 'Kenyan families face succession disputes', icon: HeartHandshake },
    { value: 'KES 20B+', label: 'In unclaimed or frozen assets annually', icon: Lock },
    { value: '2–10 Years', label: 'Average time to resolve probate cases', icon: Scale },
  ], []);

  const detailedPillars = React.useMemo(() => [
    {
      image: FamilyTreeViz,
      label: 'Family Harmony',
      icon: Users,
      title: t('pillars.family.detail_title', 'A Foundation of Clarity'),
      description: t('pillars.family.detail_description', 'Map every legal beneficiary according to Kenyan succession law. Prevent disagreements by creating one trusted family record.'),
      features: [
        'Supports complex family structures including polygamy',
        'Protects rights of minor children and dependents',
        'Secure digital identity verification',
        'Distinguishes legal heirs from relatives',
      ],
    },
    {
      image: EstateInventory,
      label: 'Asset Transparency',
      icon: Building2,
      title: t('pillars.estate.detail_title', 'Complete Estate Visibility'),
      description: t('pillars.estate.detail_description', 'Securely store and verify all asset documents. Get real-time net worth and ensure fair distribution.'),
      features: [
        'Automatic net worth calculation',
        'Tracks lifetime gifts for equitable shares',
        'Bank-grade encrypted document vault',
        'Prevents fraudulent claims',
      ],
    },
    {
      image: SuccessionRoadmap,
      label: 'Legal Guidance',
      icon: Scale,
      title: t('pillars.succession.detail_title', 'Your Step-by-Step Legal Path'),
      description: t('pillars.succession.detail_description', 'Personalized roadmap with court-ready forms. Complete each required step in the correct order.'),
      features: [
        'Works with or without a will',
        'Generates Petition & Administration forms',
        'Secure online beneficiary consents',
        'Task tracking for executors and administrators',
      ],
    },
  ], [t]);

  return (
    <div className="flex flex-col bg-slate-50 text-slate-900">
      
      {/* HERO */}
      <section className="bg-white pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Kenya's Trusted Succession Platform
              </span>
              <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Secure Your Family's Future with Clarity and Compliance
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Mirathi guides families and executors through Kenya's succession process with transparency, security, and full adherence to the Law of Succession Act (Cap 160).
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                >
                  Start Free Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/how-it-works')}
                  className="w-full sm:w-auto border-slate-300 text-slate-900"
                >
                  Learn How It Works
                </Button>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <img 
                src={HeroImage} 
                alt="Mirathi platform interface showing family tree, asset inventory, and succession roadmap" 
                className="w-full rounded-2xl shadow-xl border border-slate-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CHALLENGES / STATS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Succession Disputes Affect Too Many Kenyan Families
            </h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {challenges.map((item) => (
              <div key={item.value} className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                <item.icon className="mx-auto h-10 w-10 text-emerald-600" />
                <div className="mt-4 text-4xl font-bold text-slate-900">{item.value}</div>
                <p className="mt-3 text-sm font-medium text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-slate-500">
            Sources: Judiciary of Kenya Annual Reports, FSD Kenya
          </p>
        </div>
      </section>

      {/* CORE PILLARS */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built on Three Essential Pillars
            </h2>
            <p className="mt-6 text-lg text-slate-600">
              Everything you need for a complete, compliant, and undisputed succession process.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <feature.icon className="h-6 w-6 text-emerald-700" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-4 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED PILLARS */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="space-y-32">
            {detailedPillars.map((pillar, index) => (
              <div 
                key={pillar.title}
                className={`grid gap-12 lg:grid-cols-2 lg:items-center ${index % 2 === 1 ? 'lg:grid-cols-2 lg:[&>*:first-child]:order-last' : ''}`}
              >
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                    <pillar.icon className="h-4 w-4" />
                    {pillar.label}
                  </span>
                  <h3 className="mt-6 text-3xl font-bold text-slate-900">{pillar.title}</h3>
                  <p className="mt-4 text-lg text-slate-600">{pillar.description}</p>
                  <ul className="mt-8 space-y-4">
                    {pillar.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <img 
                    src={pillar.image} 
                    alt={`Illustration of ${pillar.title.toLowerCase()} in Mirathi platform`}
                    className="w-full rounded-xl shadow-lg border border-slate-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900 px-8 py-20 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Protect What Matters Most
            </h2>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
              Start building your secure succession plan today. No credit card required.
            </p>
            <div className="mt-10">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg px-8 py-4"
              >
                Create Your Free Account
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              Free readiness assessment • Bank-grade encryption • Compliant with Kenyan law
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}