// FILE: src/pages/public/HomePage.tsx
// VERSION 2.0: Market-Focused, Benefit-Driven
// DESIGN: Light, Professional, High-Trust "Old Money" Aesthetic

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
  Landmark} from 'lucide-react';

import { Button } from '../../components/ui/Button';

// --- VISUAL ASSETS ---
import HeroImage from '../../assets/hero-mirathi-light.png'; // A lighter, more hopeful hero image
import FamilyTreeViz from '../../assets/family-connections.png';
import EstateInventory from '../../assets/estate-dashboard.png';
import SuccessionRoadmap from '../../assets/succession-roadmap.png';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  // 1. THE CORE VALUE PROPOSITION (User-Friendly Language)
  const features = React.useMemo(() => [
    { 
      icon: Users, 
      titleKey: 'pillars.family.title',
      defaultTitle: 'Establish Your Legacy Line',
      descriptionKey: 'pillars.family.description',
      defaultDesc: 'Create a single, undisputed source of truth for your family tree, ensuring all legal heirs are identified to prevent future disputes.',
      color: 'navy'
    },
    { 
      icon: Landmark, 
      titleKey: 'pillars.estate.title',
      defaultTitle: 'Organize Your Assets',
      descriptionKey: 'pillars.estate.description',
      defaultDesc: 'Build a complete, verified inventory of all property—from land and vehicles to shares and bank accounts—for a clear view of your net worth.',
      color: 'gold'
    },
    { 
      icon: Scale, 
      titleKey: 'pillars.succession.title',
      defaultTitle: 'Automate the Legal Process',
      descriptionKey: 'pillars.succession.description',
      defaultDesc: 'Our intelligent platform guides you through every required legal step, automatically preparing court documents and ensuring full compliance.',
      color: 'navy'
    },
  ], []);

  // 2. THE PROBLEM WE SOLVE (The Emotional Hook)
  const problems = React.useMemo(() => [
    { value: '7 out of 10', label: 'Families face succession disputes', icon: HeartHandshake },
    { value: 'KES 20B+', label: 'Tied up in unclaimed assets', icon: Lock },
    { value: 'Years', label: 'Lost in court battles', icon: Scale },
  ], []);

  // 3. DETAILED FEATURES (Translating Tech to Benefits)
  const pillarsDetailed = React.useMemo(() => [
    {
      image: FamilyTreeViz,
      color: 'navy',
      label: 'Clarity for Your Family',
      icon: Users,
      titleKey: 'pillars.family.detail_title',
      defaultTitle: 'A Foundation of Harmony',
      descriptionKey: 'pillars.family.detail_description',
      defaultDesc: 'Prevent disagreements before they start. Our platform helps you map every beneficiary, spouse, and dependent according to Kenyan law, creating a single version of the truth the whole family can agree on.',
      features: [
        'Handles Complex Family Structures (Polygamy)',
        'Safeguards Minor Children\'s Inheritance',
        'Secure Digital Identity Verification',
        'Maps Legal Heirs, Not Just Relatives'
      ]
    },
    {
      image: EstateInventory,
      color: 'gold',
      label: 'A Transparent Inventory',
      icon: Landmark,
      titleKey: 'pillars.estate.detail_title',
      defaultTitle: 'A Real-Time View of Your Estate',
      descriptionKey: 'pillars.estate.detail_description',
      defaultDesc: 'Know exactly where you stand. Mirathi’s Digital Vault allows you to securely upload and verify all asset documents, giving you a live, accurate calculation of your estate’s total value.',
      features: [
        'Automatic Net Worth Calculation',
        'Accounts for Past Gifts for Fair Shares',
        'Secure Digital Document Vault (AES-256)',
        'Protects Creditors & Prevents Illegal Payouts'
      ]
    },
    {
      image: SuccessionRoadmap,
      color: 'navy',
      label: 'A Guided Legal Path',
      icon: Scale,
      titleKey: 'pillars.succession.detail_title',
      defaultTitle: 'Your Guided Path Through Court',
      descriptionKey: 'pillars.succession.detail_description',
      defaultDesc: 'Never feel lost or wonder what to do next. The Mirathi Copilot analyzes your situation and creates a personalized roadmap, unlocking each step only when the previous one is correctly completed.',
      features: [
        'Tailored for All Scenarios (With or Without a Will)',
        'Court-Ready Document Generation (P&A Forms)',
        'Secure Online Beneficiary Consents',
        'Step-by-Step Task Management for Executors'
      ]
    }
  ], []);

  return (
    <div className="flex flex-col bg-neutral-50 font-sans text-neutral-800">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Clarity and Confidence */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative overflow-hidden bg-white pt-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 lg:gap-x-12 lg:items-center">
            {/* Text Content */}
            <div className="relative z-10 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0F3D3E]/10 px-4 py-1.5 text-sm font-semibold text-[#0F3D3E]">
                <ShieldCheck className="h-4 w-4 text-[#C8A165]" />
                Kenya's #1 Succession Platform
              </span>
              <h1 className="mt-8 font-serif text-4xl font-bold tracking-tight text-[#0F3D3E] sm:text-5xl lg:text-6xl">
                Navigate Inheritance with Clarity & Confidence.
              </h1>
              <p className="mt-6 text-lg leading-8 text-neutral-600">
                Mirathi transforms the complex, paper-based succession process into a simple, secure, and transparent digital journey. We are the Digital Copilot for your family's legacy.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="group bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white shadow-lg shadow-[#0F3D3E]/20"
                >
                  Start Your Plan for Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  onClick={() => navigate('/how-it-works')}
                  className="group text-[#0F3D3E] hover:bg-neutral-100"
                >
                  See How It Works <span aria-hidden="true" className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </Button>
              </div>
            </div>
            {/* Image Content */}
            <div className="relative mt-12 lg:mt-0">
               <div className="absolute -top-16 -right-16 w-96 h-96 bg-[#C8A165]/10 rounded-full blur-3xl" />
               <img src={HeroImage} alt="Mirathi Dashboard showing a clear succession plan" className="relative rounded-2xl shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* PROBLEM / STATS SECTION - The Urgency */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8"> 
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-[#C8A165]">The Cost of Delay</h2>
            <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#0F3D3E] sm:text-4xl">
              Disorganization and disputes can freeze a family's future.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
            {problems.map((stat, index) => (
              <div key={index} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center">
                <stat.icon className="mx-auto mb-4 h-8 w-8 text-[#C8A165]" />
                <div className="font-serif text-4xl font-bold text-[#0F3D3E]">{stat.value}</div>
                <p className="mt-2 text-sm font-medium text-neutral-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs text-neutral-500">
            Source: FSD Kenya, Judiciary of Kenya Reports
          </p>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* CORE FEATURES (Was Service Map) */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-28 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-base font-semibold leading-7 text-[#C8A165]">Our Foundation</h2>
            <p className="mt-2 font-serif text-3xl font-bold tracking-tight text-[#0F3D3E] sm:text-4xl">
              Clarity at Every Step of the Journey
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
              Mirathi is built on three core pillars that work together to create a single, undisputed path from planning to inheritance.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.titleKey}
                icon={feature.icon}
                title={t(feature.titleKey, feature.defaultTitle)}
                description={t(feature.descriptionKey, feature.defaultDesc)}
                color={feature.color}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* DETAILED PILLARS */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="bg-white py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="space-y-24">
            {pillarsDetailed.map((pillar, index) => (
              <PillarDetailCard
                key={pillar.titleKey}
                image={pillar.image}
                color={pillar.color}
                label={pillar.label}
                icon={pillar.icon}
                title={t(pillar.titleKey, pillar.defaultTitle)}
                description={t(pillar.descriptionKey, pillar.defaultDesc)}
                features={pillar.features}
                reversed={index % 2 === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FINAL CTA SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:py-32">
          <div className="relative isolate overflow-hidden bg-[#0F3D3E] px-6 py-24 text-center shadow-2xl rounded-3xl sm:px-16">
            <h2 className="mx-auto max-w-2xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Don't leave your legacy to chance.
              <span className="mt-2 block text-[#C8A165]">
                Leave it to Logic.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-neutral-300">
              Create your account today. Secure your Family Tree, Inventory your Assets, and be ready for whatever the future holds.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="group bg-[#C8A165] hover:bg-[#C8A165]/90 text-[#0F3D3E] font-bold"
              >
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <p className="mt-6 text-sm text-neutral-400">
              No credit card required • Free Readiness Assessment • Bank-grade Security
            </p>
             {/* Decorative elements */}
            <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
              <circle cx="512" cy="512" r="512" fill="url(#8d958450-c69f-4251-94bc-4e091a323369)" fillOpacity="0.7"></circle>
              <defs>
                <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
                  <stop stopColor="#C8A165"></stop>
                  <stop offset="1" stopColor="#0F3D3E"></stop>
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SUB-COMPONENTS (Styled for Light Theme)
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function FeatureCard({ icon: Icon, title, description, color }: { 
  icon: React.ElementType; title: string; description: string; color: string;
}) {
  const styles: Record<string, string> = {
    navy: 'text-[#0F3D3E] bg-[#0F3D3E]/5 border-[#0F3D3E]/10',
    gold: 'text-[#C8A165] bg-[#C8A165]/5 border-[#C8A165]/10',
  };
  const currentStyle = styles[color] || styles.navy;

  return (
    <div className={`group rounded-2xl border p-8 text-left transition-all duration-300 hover:shadow-xl hover:border-transparent ${currentStyle}`}>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm border ${currentStyle}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 font-serif text-lg font-bold text-[#0F3D3E]">{title}</h3>
      <p className="text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
}

function PillarDetailCard({ image, color, label, icon: Icon, title, description, features, reversed }: { 
  image: string; color: string; label: string; icon: React.ElementType; title: string; description: string; features: string[]; reversed: boolean;
}) {
  const styles: Record<string, string> = {
    navy: 'text-[#0F3D3E] bg-[#0F3D3E]/10 border-[#0F3D3E]/20',
    gold: 'text-[#C8A165] bg-[#C8A165]/10 border-[#C8A165]/20',
  };
  const theme = styles[color];

  return (
    <div className={`grid gap-12 lg:grid-cols-2 lg:items-center ${reversed ? 'lg:[&>*:last-child]:-order-1' : ''}`}>
      {/* Content Side */}
      <div>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${theme}`}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <h3 className="mt-6 font-serif text-3xl font-bold text-[#0F3D3E] leading-tight">
          {title}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          {description}
        </p>
        <ul className="mt-8 space-y-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${color === 'gold' ? 'text-[#C8A165]' : 'text-[#0F3D3E]'}`} />
              <span className="text-neutral-700 font-medium">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Image Side */}
      <div className="relative group">
        <div className={`absolute -inset-4 rounded-2xl opacity-10 blur-xl transition-opacity group-hover:opacity-20 ${color === 'gold' ? 'bg-[#C8A165]' : 'bg-[#0F3D3E]'}`}></div>
        <img src={image} alt={title} className="relative w-full h-auto rounded-xl shadow-2xl border border-neutral-200" />
      </div>
    </div>
  );
}