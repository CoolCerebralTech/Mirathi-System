// FILE: src/pages/public/HomePage.tsx
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
  Building2,
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/Button';

// Placeholder assets - Replace with actual optimized WebP images in production
import HeroImage from '@/assets/hero-mirathi-light.png';
import FamilyTreeViz from '@/assets/family-connections.png';
import EstateInventory from '@/assets/estate-dashboard.png';
import SuccessionRoadmap from '@/assets/succession-roadmap.png';

export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  const challenges = React.useMemo(() => [
    { 
      value: '7 in 10', 
      label: 'Kenyan families face succession disputes', 
      icon: HeartHandshake,
      source: 'Judiciary Reports'
    },
    { 
      value: 'KES 20B+', 
      label: 'In unclaimed or frozen assets annually', 
      icon: Lock,
      source: 'UFAA & FSD Kenya'
    },
    { 
      value: '2–10 Years', 
      label: 'Average time to resolve probate cases', 
      icon: Scale,
      source: 'Case Backlog Data'
    },
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
    <div className="flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white pt-16 pb-16 lg:pt-24 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 lg:items-center lg:gap-16">
            
            {/* Hero Content */}
            <div className="text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 mb-8">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Kenya's Trusted Succession Platform
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
                Secure Your Family's Future with <span className="text-emerald-700">Clarity</span> and Compliance
              </h1>
              
              <p className="mt-6 text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Mirathi guides families and executors through Kenya's succession process with transparency, bank-grade security, and full adherence to the Law of Succession Act (Cap 160).
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-900/10"
                >
                  Start Free Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/how-it-works')}
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                >
                  Learn How It Works
                </Button>
              </div>
            </div>

            {/* Hero Image / Visual */}
            <div className="mt-12 lg:mt-0 relative">
              <div className="absolute -inset-4 bg-emerald-100/30 rounded-full blur-3xl opacity-30 animate-pulse" />
              <div className="relative rounded-2xl bg-slate-900/5 p-2 ring-1 ring-inset ring-slate-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                <img 
                  src={HeroImage} 
                  alt="Mirathi platform dashboard interface" 
                  width={2432}
                  height={1442}
                  className="w-full rounded-xl shadow-2xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION (Authority) */}
      <section className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Succession Disputes Affect Too Many Families
            </h2>
            <p className="mt-4 text-slate-600">
              The cost of inaction or improper planning is high. Mirathi helps you avoid these statistics.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {challenges.map((item) => (
              <div key={item.value} className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <item.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {item.source}
                  </span>
                </div>
                <div className="text-4xl font-bold text-slate-900 mb-3">{item.value}</div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE PILLARS OVERVIEW */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built on Three Essential Pillars
            </h2>
            <p className="mt-6 text-lg text-slate-600">
              A comprehensive system designed to handle the complexities of African family structures and legal requirements.
            </p>
          </div>
          
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { icon: Users, title: 'Establish Family Lines', desc: 'Create a single, undisputed record of all legal heirs to prevent future disputes.' },
              { icon: Building2, title: 'Organize the Estate', desc: 'Build a verified inventory of all assets for full transparency and accurate distribution.' },
              { icon: FileText, title: 'Navigate the Law', desc: 'Automated generation of court forms and guidance through the probate process.' }
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-sm mb-6">
                  <feature.icon className="h-7 w-7 text-emerald-700" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED BREAKDOWN (Alternating) */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="space-y-32">
            {detailedPillars.map((pillar, index) => (
              <div 
                key={pillar.title}
                className={`grid gap-16 lg:grid-cols-2 lg:items-center ${index % 2 === 1 ? 'lg:grid-cols-2 lg:[&>*:first-child]:order-last' : ''}`}
              >
                {/* Content Side */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white border border-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm mb-8">
                    <pillar.icon className="h-4 w-4" />
                    {pillar.label}
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-6">{pillar.title}</h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">{pillar.description}</p>
                  
                  <ul className="space-y-4">
                    {pillar.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                        <span className="text-slate-700 font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image Side */}
                <div className="relative">
                  {/* Decorative background element */}
                  <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-100/50 to-transparent rounded-2xl transform ${index % 2 === 0 ? '-rotate-2' : 'rotate-2'}`} />
                  <img 
                    src={pillar.image} 
                    alt={`Illustration of ${pillar.title}`}
                    className="relative w-full rounded-xl shadow-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-20 text-center shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute right-0 top-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-emerald-500 blur-3xl" />
              <div className="absolute left-0 bottom-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
                Protect What Matters Most
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                Start building your secure succession plan today. <br className="hidden sm:block"/>
                Professional guidance without the complexity.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg px-8 py-6 h-auto"
                >
                  Create Your Free Account
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Bank-grade encryption
                </span>
                <span className="flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Compliant with Cap 160
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}