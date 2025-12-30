// FILE: src/pages/public/HomePage.tsx
// CONTEXT: Mirathi System Architecture (Identity -> Inventory -> Process)
// DESIGN: Dark Mode, Fintech/Legal-Tech, Trust-First

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  FileText, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Brain, 
  Zap, 
  Lock, 
  Scale, 
  Sparkles, 
  TrendingUp, 
  Heart,
  Activity,
  Network,
  FileCheck
} from 'lucide-react';

import { Button } from '../../components/ui/Button';

// Ensure these image paths match your project structure
import HeroImage from '../../assets/hero-mirathi.png';
import FamilyTreeViz from '../../assets/family-connections.png';
import EstateInventory from '../../assets/estate-dashboard.png';
import SuccessionRoadmap from '../../assets/succession-roadmap.png';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function HomePage() {
  const { t } = useTranslation(['home', 'common']);
  const navigate = useNavigate();

  // 1. HIGH LEVEL PILLARS (The Service Map)
  const features = React.useMemo(() => [
    { 
      icon: Users, 
      titleKey: 'pillars.family.title',
      defaultTitle: 'Family Service',
      descriptionKey: 'pillars.family.description',
      defaultDesc: 'The Source of Kinship Truth. We map S.40 Houses and biological relationships to establish legal beneficiaries.',
      color: 'blue',
      label: 'Identity Layer'
    },
    { 
      icon: Shield, 
      titleKey: 'pillars.estate.title',
      defaultTitle: 'Estate Service',
      descriptionKey: 'pillars.estate.description',
      defaultDesc: 'The Economic Truth Engine. A deterministic inventory of Assets vs. Debts to ensure solvency before distribution.',
      color: 'emerald',
      label: 'Inventory Layer'
    },
    { 
      icon: Brain, 
      titleKey: 'pillars.succession.title',
      defaultTitle: 'Succession Service',
      descriptionKey: 'pillars.succession.description',
      defaultDesc: 'The Digital Lawyer. Automates compliance with Cap 160, generating court-ready forms (P&A 80, P&A 5).',
      color: 'purple',
      label: 'Process Layer'
    },
  ], []);

  // 2. CRISIS STATS
  const stats = React.useMemo(() => [
    { value: '26.2%', label: 'Succession Conflicts', icon: TrendingUp },
    { value: '38.6%', label: 'Family Land Loss', icon: Heart },
    { value: '10+', label: 'Years in Court', icon: Scale },
  ], []);

  // 3. DEEP DIVE (The "Constitution" Logic)
  const pillarsDetailed = React.useMemo(() => [
    {
      image: FamilyTreeViz,
      color: 'blue',
      label: 'Pillar One: Identity',
      icon: Users,
      titleKey: 'pillars.family.detail_title',
      defaultTitle: 'Kinship is not an Opinion.',
      descriptionKey: 'pillars.family.detail_description',
      defaultDesc: 'Mirathi separates "Family" from "Finance". We create a digital twin of your family tree that strictly adheres to the Children Act and Marriage Act, ensuring no rightful beneficiary is excluded.',
      features: [
        'Tracks S.40 Polygamous Houses logic',
        'Verifies Guardianship for minors',
        'Biometric-ready Identity Resolution',
        'Separates Biological ties from Asset claims'
      ]
    },
    {
      image: EstateInventory,
      color: 'emerald',
      label: 'Pillar Two: Inventory',
      icon: Activity,
      titleKey: 'pillars.estate.detail_title',
      defaultTitle: 'Mathematical Economic Truth.',
      descriptionKey: 'pillars.estate.detail_description',
      defaultDesc: 'An estate cannot be distributed if it is insolvent. Our "Active Intelligence" calculates Net Estate Value in real-time, enforcing S.45 priority (Funeral > Secured Debts > Unsecured Debts).',
      features: [
        'Real-time Solvency Radar',
        'Tracks Inter Vivos Gifts (Hotchpot)',
        'Automated Asset Valuation Strategy',
        'Blocks distribution if debts exceed assets'
      ]
    },
    {
      image: SuccessionRoadmap,
      color: 'purple',
      label: 'Pillar Three: Process',
      icon: Scale,
      titleKey: 'pillars.succession.detail_title',
      defaultTitle: 'Automated Compliance.',
      descriptionKey: 'pillars.succession.detail_description',
      defaultDesc: 'The system acts as a "Digital Copilot," preventing you from generating forms until the Readiness Score reaches 80%. It handles the complexity of Intestate vs. Testate workflows automatically.',
      features: [
        'Context Detection (Islamic vs Civil)',
        'Auto-generates Form P&A 80 & 5',
        'Digital Consents (Form 38) Workflow',
        'Executor Roadmap & Task unlocking'
      ]
    }
  ], []);

  // 4. THE EVENT-DRIVEN FLOW
  const howItWorksSteps = React.useMemo(() => [
    { 
      icon: Activity, 
      color: 'amber',
      title: 'The "Death Event"',
      description: 'You upload a Death Certificate. The system freezes the Estate Service to protect assets and triggers the Succession Service.'
    },
    { 
      icon: FileText, 
      color: 'blue',
      title: 'Document Verification',
      description: 'Upload assets (Title Deeds). Our OCR extracts data, and Verifiers approve the "Claim Check" to validate the asset.'
    },
    { 
      icon: Network, 
      color: 'emerald',
      title: 'Graph Consensus',
      description: 'The Family Service prompts all beneficiaries to sign digital consents, ensuring the family graph is agreed upon.'
    },
    { 
      icon: Brain, 
      color: 'purple',
      title: 'Readiness Audit',
      description: 'The Intelligence Engine runs a compliance check. If the score is >80%, it unlocks the filing generation.'
    },
    { 
      icon: FileCheck, 
      color: 'green',
      title: 'Court Filing',
      description: 'Download the complete, legally compliant PDF bundle ready for the High Court registry.'
    }
  ], []);

  return (
    <div className="flex flex-col bg-slate-950 font-sans text-slate-100">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Intelligence Engine */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section 
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 0.95)), url(${HeroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Cinematic Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]"></div>

        <div className="relative z-10 px-4 text-center max-w-6xl mx-auto mt-12">
          {/* Status Badge */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-3 backdrop-blur-md animate-fade-in-up">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            <span className="text-sm font-semibold text-amber-100 tracking-wide">
              Active Intelligence Engine • System Version 1.0.0
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl tracking-tight">
            {t('hero.title', 'The Digital')}
            <span className="mt-2 block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              {t('hero.subtitle', 'Succession Copilot')}
            </span>
          </h1>

          {/* Subheadline - The Philosophy */}
          <p className="mx-auto mt-8 max-w-3xl text-lg font-light leading-relaxed text-slate-300 md:text-xl lg:text-2xl">
            {t('hero.description', 'Mirathi replaces the manual, error-prone role of a legal clerk with a deterministic system. We separate Identity from Inventory to automate your path to the High Court.')}
          </p>

          {/* Service Map Visual Indicator */}
          <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
              <Users className="h-4 w-4" /> Family Service
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <Shield className="h-4 w-4" /> Estate Service
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Brain className="h-4 w-4" /> Succession Service
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')} 
              className="group w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-lg font-bold text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] hover:-translate-y-1 border-0"
            >
              <div className="flex w-full items-center justify-center gap-3 px-4">
                <span>{t('hero.cta_main', 'Start Readiness Audit')}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/features')} 
              className="w-full border border-slate-600 bg-slate-800/50 text-lg font-medium text-slate-100 backdrop-blur-md transition-all duration-300 hover:bg-slate-700/80 hover:border-slate-500 sm:w-auto"
            >
              {t('hero.cta_secondary', 'View Service Map')}
            </Button>
          </div>

          {/* Compliance & Security */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">{t('hero.trust.kdpa', 'Data Protection Act 2019')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">{t('hero.trust.law', 'Law of Succession Act (Cap 160)')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium">{t('hero.trust.encryption', 'AES-256 Vault')}</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="h-14 w-8 rounded-full border border-slate-600 flex justify-center pt-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* STATS SECTION - The Urgency */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-20 lg:py-28 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12"> 
          <div className="mx-auto max-w-4xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-red-400">
              The Cost of Manual Process
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-white md:text-4xl">
              Why "Frozen Estates" Destroy Wealth
            </h2>
            <p className="mt-6 text-lg text-slate-400">
              Without a deterministic system, families rely on memory and manual paperwork, leading to disputes that block asset transfer.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center transition-all duration-300 hover:border-red-900/50 hover:bg-slate-900"
              >
                <stat.icon className="mx-auto mb-6 h-10 w-10 text-red-500/70 transition-transform group-hover:scale-110 group-hover:text-red-500" />
                <div className="font-serif text-5xl font-bold text-slate-100">{stat.value}</div>
                <p className="mt-4 text-sm font-medium text-slate-400 uppercase tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs text-slate-600">
            Source: Kenya National Bureau of Statistics • Judiciary of Kenya (Probate Division)
          </p>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SERVICE MAP - High Level */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-28 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-amber-500">
              System Architecture
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white md:text-5xl">
              Three Pillars. One Truth.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              We avoid the "God Object" trap of legacy systems. Mirathi strictly separates facts (Family) from money (Estate) and procedure (Succession).
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
                label={feature.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* DEEP DIVE - The 3 Services Visualized */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-slate-800 bg-slate-900 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="space-y-32">
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
      {/* EVENT DRIVEN WORKFLOW - "How It Works" */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-28 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left: Text Context */}
            <div className="lg:sticky lg:top-24">
              <span className="text-sm font-bold uppercase tracking-widest text-amber-500">
                Event-Driven Architecture
              </span>
              <h2 className="mt-4 font-serif text-4xl font-bold text-white md:text-5xl">
                See the System Respond
              </h2>
              <p className="mt-6 text-lg text-slate-400 leading-relaxed">
                Mirathi is an <strong>Event-Driven</strong> system. Microservices communicate asynchronously. 
                <br /><br />
                When you trigger a "Death Event" in the Family Service, the Estate Service automatically locks assets to prevent fraud, and the Succession Service generates a tailored Roadmap.
              </p>
              <div className="mt-8 p-6 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Why this matters?
                </h4>
                <p className="mt-2 text-sm text-slate-400">
                  This guarantees that the legal process (filing forms) cannot proceed until the economic facts (assets) and identity facts (family) are 100% verified.
                </p>
              </div>
            </div>

            {/* Right: The Timeline */}
            <div className="relative space-y-0">
              {/* Vertical Connector */}
              <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-blue-500 via-emerald-500 to-purple-500 opacity-30"></div>

              {howItWorksSteps.map((step, idx) => (
                <HowItWorksStep
                  key={idx}
                  icon={step.icon}
                  color={step.color}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* CTA SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-24 lg:py-32 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            
            <h2 className="font-serif text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Don't leave your legacy to chance.
              <span className="mt-2 block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                Leave it to Logic.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Create your account today. Secure your Family Tree, Inventory your Assets, and be ready for whatever happens.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="group bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg px-8 py-6 h-auto"
              >
                <div className="flex items-center gap-3">
                  <span>Create Free Account</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Button>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              No credit card required • Free Readiness Assessment • Bank-grade Security
            </p>

          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SUB-COMPONENTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  color,
  label
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  color: string;
  label: string;
}) {
  const styles: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10',
    purple: 'text-purple-400 bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10',
  };

  const currentStyle = styles[color] || styles.blue;

  return (
    <div className={`group flex flex-col rounded-2xl border p-8 text-left backdrop-blur-sm transition-all duration-300 ${currentStyle}`}>
      <div className="mb-6 flex items-center justify-between">
         <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-slate-950/50 border border-current opacity-80`}>
            <Icon className="h-7 w-7" />
         </div>
         <span className="text-xs font-bold uppercase tracking-widest opacity-60 border border-current px-2 py-1 rounded-full">
            {label}
         </span>
      </div>
      
      <h3 className="mb-3 font-serif text-xl font-bold text-white">{title}</h3>
      <p className="flex-grow leading-relaxed text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function PillarDetailCard({ 
  image,
  color,
  label,
  icon: Icon,
  title,
  description,
  features,
  reversed
}: { 
  image: string;
  color: string;
  label: string;
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  reversed: boolean;
}) {
  const styles: Record<string, string> = {
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
  };
  const theme = styles[color];

  return (
    <div className={`grid gap-12 lg:grid-cols-2 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
      {/* Content Side */}
      <div>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider border ${theme}`}>
          <Icon className="h-3 w-3" />
          {label}
        </div>
        <h3 className="mt-6 font-serif text-3xl font-bold text-white leading-tight">
          {title}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-slate-400">
          {description}
        </p>
        <ul className="mt-8 space-y-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 group">
              <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${theme.split(' ')[0]} opacity-70 group-hover:opacity-100 transition-opacity`} />
              <span className="text-slate-300 font-medium">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Image Side */}
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-2xl opacity-20 blur-lg transition-opacity group-hover:opacity-40 bg-current ${theme.split(' ')[0]}`}></div>
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 shadow-2xl">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
          />
          {/* Overlay gradient for text readability if needed, or just aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksStep({
  icon: Icon,
  color,
  title,
  description
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
}) {
  const colors: Record<string, string> = {
    amber: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    blue: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    emerald: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    purple: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    green: 'text-green-400 border-green-500/40 bg-green-500/10',
  };
  
  const style = colors[color] || colors.blue;

  return (
    <div className="relative flex gap-6 pb-12 last:pb-0">
      <div className={`relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-2 shadow-[0_0_15px_rgba(0,0,0,0.3)] ${style}`}>
        <Icon className="h-8 w-8" />
      </div>
      <div className="pt-2">
        <h4 className="font-bold text-xl text-white">{title}</h4>
        <p className="mt-2 text-slate-400 leading-relaxed max-w-md">{description}</p>
      </div>
    </div>
  );
}