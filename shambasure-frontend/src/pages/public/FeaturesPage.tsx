import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileText, // For Generated Forms
  Users, // For Family Service
  CheckCircle2, // General Checkmark
  Shield, // For Estate Service (Protection)
  ArrowRight, // CTA Arrow
  Brain, // For Succession Service (Intelligence)
  Lock, // For Security/Encryption
  Scale, // For Compliance/Law
  Zap, // For Automation/Efficiency
  UserCheck, // For Collaboration/Roles (Account Service)
  TrendingUp, // For Metrics/Growth
  BarChart3, // For Dashboard/Overview (API Gateway)
  Eye, // For Document Service (Verification)
  Sparkles, // General accent / "intelligence"
  Network // For Event-Driven architecture
} from 'lucide-react';

import { Button } from '../../components/ui/Button'; // Reusing the Button component

// Import the NEW AI-generated product UI images - ensure these paths are correct
import DashboardOverview from '../../assets/dashboard-overview.png';
import FamilyBuilderUI from '../../assets/family-builder-ui.png';
import AssetInventoryUI from '../../assets/asset-inventory-ui.png';
import ReadinessAssessmentUI from '../../assets/readiness-assessment-ui.png';
import FormGeneratorUI from '../../assets/form-generator-ui.png';
import DocumentVerificationUI from '../../assets/document-verification-ui.png';
import CollaborationUI from '../../assets/collaboration-ui.png';


// Product features organized by service for the interactive tour
const productFeatures = [
  {
    id: 'dashboard_overview',
    icon: BarChart3,
    image: DashboardOverview,
    color: 'amber',
    category: 'API Gateway / Overview',
    titleKey: 'tour.dashboard_overview.title',
    defaultTitle: 'Executive Estate Dashboard',
    descriptionKey: 'tour.dashboard_overview.description',
    defaultDescription: 'Unified view of your estate’s solvency, family graph, and succession readiness score, aggregated by the API Gateway.',
    detailKey: 'tour.dashboard_overview.detail',
    defaultDetail: 'A high-level, real-time aggregation of your entire Mirathi profile, providing critical insights into your family structure, asset valuation, and the current status of your succession process. This view is powered by the API Gateway, combining data from all microservices into one intuitive interface.'
  },
  {
    id: 'family_builder',
    icon: Users,
    image: FamilyBuilderUI,
    color: 'blue',
    category: 'Family Service',
    titleKey: 'tour.family_builder.title',
    defaultTitle: 'Kinship Truth Engine',
    descriptionKey: 'tour.family_builder.description',
    defaultDescription: 'Visually map all legal and biological relationships, including S.40 polygamous houses and guardianship assignments.',
    detailKey: 'tour.family_builder.detail',
    defaultDetail: 'The Family Service allows you to build a precise digital twin of your family tree, strictly adhering to the Children Act and Marriage Act. It intelligently models complex kinship structures like polygamous houses (S.40) and tracks guardianship, ensuring every rightful beneficiary is accounted for, preventing future disputes over identity.'
  },
  {
    id: 'document_verification',
    icon: Eye,
    image: DocumentVerificationUI,
    color: 'cyan', // New color for Document Service
    category: 'Document Service',
    titleKey: 'tour.document_verification.title',
    defaultTitle: 'Intelligent Document Vault',
    descriptionKey: 'tour.document_verification.description',
    defaultDescription: 'Securely upload, OCR-scan, and verify all critical legal documents (Title Deeds, Death Certificates) with the Document Service.',
    detailKey: 'tour.document_verification.detail',
    defaultDetail: 'Our Document Service acts as your intelligent utility. It securely stores all legal files (e.g., Title Deeds, ID scans) in an AES-256 encrypted S3 bucket. Advanced OCR extracts key data, which is then sent for manual verification by a VERIFIER, ensuring data accuracy and compliance for legal audit trails. This employs the "Claim Check" pattern, storing only IDs in other services.'
  },
  {
    id: 'asset_inventory',
    icon: Shield,
    image: AssetInventoryUI,
    color: 'emerald',
    category: 'Estate Service',
    titleKey: 'tour.asset_inventory.title',
    defaultTitle: 'Economic Truth Engine',
    descriptionKey: 'tour.asset_inventory.description',
    defaultDescription: 'Manage all assets and debts. Real-time solvency calculations enforce S.45 priority, blocking distribution if the estate is insolvent.',
    detailKey: 'tour.asset_inventory.detail',
    defaultDetail: 'The Estate Service provides a deterministic inventory of all assets and liabilities. It dynamically calculates the Net Estate Value and enforces S.45 priority rules (Funeral > Secured > Unsecured Debts). Any change triggers a "Dirty Flag" recalculation, and the "Insolvency Radar" proactively alerts users, preventing illegal distributions and financial chaos.'
  },
  {
    id: 'readiness_assessment',
    icon: Brain,
    image: ReadinessAssessmentUI,
    color: 'purple',
    category: 'Succession Service',
    titleKey: 'tour.readiness_assessment.title',
    defaultTitle: 'Succession Readiness Audit',
    descriptionKey: 'tour.readiness_assessment.description',
    defaultDescription: 'Get a real-time compliance score. The system prevents form generation until legal readiness reaches 80%.',
    detailKey: 'tour.readiness_assessment.detail',
    defaultDetail: 'The Succession Service continuously assesses your readiness for court filing. It runs a "Context Detection" engine to identify the succession regime (e.g., Islamic, Polygamous, Small Estate) and prevents form generation if the ReadinessScore is below 80%. This ensures you are legally robust before approaching the court, minimizing delays and rejections.'
  },
  {
    id: 'form_generator',
    icon: FileText,
    image: FormGeneratorUI,
    color: 'purple',
    category: 'Succession Service',
    titleKey: 'tour.form_generator.title',
    defaultTitle: 'Automated Court Form Generation',
    descriptionKey: 'tour.form_generator.description',
    defaultDescription: 'Instantly generate compliant P&A 80, P&A 5, and orchestrate digital signing of Form 38 consents.',
    detailKey: 'tour.form_generator.detail',
    defaultDetail: 'Once your estate is fully reconciled and the Readiness Assessment is complete, the ProbateApplication aggregate within the Succession Service automatically generates all necessary court forms (P&A 80, P&A 5). It also orchestrates the digital signing of Family Consents (Form 38), streamlining the entire documentation process for filing.'
  },
  {
    id: 'collaboration',
    icon: UserCheck,
    image: CollaborationUI,
    color: 'sky', // New color for Collaboration
    category: 'Account Service / Collaboration',
    titleKey: 'tour.collaboration.title',
    defaultTitle: 'Role-Based Collaboration',
    descriptionKey: 'tour.collaboration.description',
    defaultDescription: 'Securely collaborate with family, lawyers, and verifiers using strict Role-Based Access Control (RBAC).',
    detailKey: 'tour.collaboration.detail',
    defaultDetail: 'Mirathi’s Account Service provides robust Role-Based Access Control (RBAC). Users, Verifiers, Admins, and Auditors have strictly defined access policies. For example, a VERIFIER can only see documents assigned to their queue with PII redacted, ensuring data protection (KDPA 2019) and secure collaboration without compromising sensitive information.'
  }
];

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function FeaturesPage() {
  const { t } = useTranslation(['features', 'common']);
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = React.useState(0);

  // Platform Capabilities, directly mapped to architectural benefits
  const capabilities = React.useMemo(() => [
    { 
      icon: Brain, 
      id: 'intelligence',
      color: 'purple',
      features: ['Active Intelligence Engine', 'Context Detection', 'Rule-based Determinism']
    },
    { 
      icon: Scale, 
      id: 'compliance', 
      color: 'blue',
      features: ['Law of Succession Act (Cap 160)', 'Children & Marriage Act', 'Court Procedures Rules']
    },
    { 
      icon: Lock, 
      id: 'security', 
      color: 'emerald',
      features: ['Data Protection Act 2019', 'AES-256 Encryption', 'Role-Based Access Control (RBAC)']
    },
    { 
      icon: Zap, 
      id: 'automation', 
      color: 'amber',
      features: ['Automated Form Generation', 'Digital Consent Orchestration', 'Dynamic Task Roadmaps']
    },
    { 
      icon: Network, // Changed icon for workflow to emphasize event-driven
      id: 'event_driven_workflow', // Updated ID
      color: 'pink', // New color for Event-Driven
      features: ['Asynchronous Microservices', 'Loose Coupling', '"Death Event" Triggers']
    },
    { 
      icon: UserCheck, 
      id: 'strict_separation', // New ID
      color: 'sky', // New color for Strict Separation
      features: ['Identity (Family) from Inventory (Estate)', 'Inventory from Process (Succession)', 'Prevents "God Object" issues']
    },
  ], []);

  return (
    <div className="bg-slate-950 font-sans text-slate-100">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Product Tour Intro */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative overflow-hidden border-b border-slate-800">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(251, 191, 36) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container relative mx-auto px-6 lg:px-8">
          <div className="mx-auto max-w-4xl py-20 text-center lg:py-28">
            
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-3 backdrop-blur-md">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-100 uppercase tracking-wide">
                {t('hero.badge', 'Platform Capabilities & Architecture')}
              </span>
            </div>
            
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t('hero.title', 'Inside the Active Intelligence Engine')}
            </h1>
            
            <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-slate-300">
              {t('hero.description', 'Explore the deterministic features that make Mirathi the most advanced succession planning platform, engineered for Kenyan legal reality.')}
            </p>
            
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="group w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-lg font-bold text-slate-950 shadow-xl shadow-amber-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/40 hover:-translate-y-1 border-0 rounded-xl px-6 py-3"
              >
                <div className="flex w-full items-center justify-center gap-3">
                  <span>{t('hero.cta_main', 'Start Free Readiness Audit')}</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/contact')} 
                className="w-full border-2 border-slate-600 bg-slate-800/50 text-lg font-medium text-slate-100 backdrop-blur-md transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-500 sm:w-auto rounded-xl px-6 py-3"
              >
                {t('hero.cta_secondary', 'Schedule Technical Demo')}
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-400" />
                <span>{t('hero.trust.no_credit', 'No credit card required')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-400" />
                <span>{t('hero.trust.setup', 'Guided setup in minutes')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* INTERACTIVE PRODUCT TOUR - Microservice Deep-Dive */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-b border-slate-800 bg-slate-900 py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
              {t('tour.eyebrow', 'Service Deep-Dive')}
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('tour.title', 'Mirathi\'s Microservices in Action')}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              {t('tour.description', 'Click through each module to understand the boundaries, responsibilities, and interactions of our Event-Driven Microservices ecosystem.')}
            </p>
          </div>

          <div className="grid items-start gap-12 lg:grid-cols-5">
            
            {/* Left: Feature Navigation */}
            <div className="lg:col-span-2">
              <div className="space-y-4 lg:sticky lg:top-28">
                {productFeatures.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(index)}
                    className={`
                      w-full cursor-pointer rounded-xl border p-5 text-left transition-all duration-300 group
                      ${activeFeature === index
                        ? 'border-amber-500/40 bg-slate-800/70 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/30 hover:bg-slate-800/50 hover:border-slate-700'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        flex-shrink-0 rounded-lg p-3 transition-all duration-300
                        ${activeFeature === index
                          ? feature.color === 'amber' ? 'scale-110 bg-amber-500/20' :
                            feature.color === 'blue' ? 'scale-110 bg-blue-500/20' :
                            feature.color === 'emerald' ? 'scale-110 bg-emerald-500/20' :
                            feature.color === 'purple' ? 'scale-110 bg-purple-500/20' :
                            feature.color === 'cyan' ? 'scale-110 bg-cyan-500/20' :
                            'scale-110 bg-sky-500/20'
                          : 'bg-slate-800 group-hover:bg-slate-700' // Consistent hover for inactive
                        }
                      `}>
                        <feature.icon className={`h-6 w-6 transition-colors duration-300 ${
                          activeFeature === index 
                            ? feature.color === 'amber' ? 'text-amber-400' :
                              feature.color === 'blue' ? 'text-blue-400' :
                              feature.color === 'emerald' ? 'text-emerald-400' :
                              feature.color === 'purple' ? 'text-purple-400' :
                              feature.color === 'cyan' ? 'text-cyan-400' :
                              'text-sky-400'
                            : 'text-slate-500 group-hover:text-slate-400' // Consistent hover for inactive
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-400">
                          {feature.category}
                        </div>
                        <h3 className="font-semibold text-lg text-white mb-1">
                          {t(feature.titleKey, feature.defaultTitle)}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {t(feature.descriptionKey, feature.defaultDescription)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Feature Preview */}
            <div className="lg:col-span-3">
              <div className="relative h-[600px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 shadow-2xl">
                {productFeatures.map((feature, index) => (
                  <div
                    key={feature.id}
                    className={`
                      absolute inset-0 transition-all duration-700
                      ${activeFeature === index 
                        ? 'z-10 opacity-100 scale-100' 
                        : 'z-0 opacity-0 scale-95'
                      }
                    `}
                  >
                    <img
                      src={feature.image}
                      alt={t(feature.titleKey, feature.defaultTitle)}
                      className="h-full w-full object-cover"
                    />
                    {/* Overlay gradient for better text visibility */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
                    
                    {/* Feature description overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-8">
                      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mb-3 ${
                        feature.color === 'amber' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300' :
                        feature.color === 'blue' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' :
                        feature.color === 'emerald' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' :
                        feature.color === 'purple' ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300' :
                        feature.color === 'cyan' ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300' :
                        'bg-sky-500/20 border border-sky-500/30 text-sky-300'
                      }`}>
                        <feature.icon className="h-4 w-4" />
                        {feature.category}
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-white mb-2">
                        {t(feature.titleKey, feature.defaultTitle)}
                      </h3>
                      <p className="text-slate-300 max-w-2xl">
                        {t(feature.detailKey, feature.defaultDetail)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature navigation dots */}
              <div className="mt-6 flex justify-center gap-2">
                {productFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`
                      h-2 rounded-full transition-all duration-300
                      ${activeFeature === index 
                        ? 'w-8 bg-amber-500' 
                        : 'w-2 bg-slate-700 hover:bg-slate-600'
                      }
                    `}
                    aria-label={`View feature ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* PLATFORM CAPABILITIES - Key Architectural Benefits */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32 bg-slate-950">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-amber-400">
              {t('capabilities.eyebrow', 'Core Tenets')}
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('capabilities.title', 'Engineered for Trust & Compliance')}
            </h2>
            <p className="mx-auto mt-6 text-lg leading-relaxed text-slate-400">
              {t('capabilities.description', 'Mirathi\'s foundation is built upon strict adherence to Kenyan law and modern, event-driven architectural principles.')}
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <CapabilityCard
                key={capability.id}
                icon={capability.icon}
                title={t(`capabilities.${capability.id}.title`, capability.id)}
                description={t(`capabilities.${capability.id}.description`, 'Description')}
                features={capability.features.map(f => t(`capabilities.${capability.id}.${f.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, f))}
                color={capability.color}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* TECHNICAL SPECS - For Technical Buyers */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-slate-800 bg-slate-900 py-20 lg:py-28">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-blue-400">
              {t('specs.eyebrow', 'Technical Excellence')}
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('specs.title', 'Enterprise-Grade Infrastructure')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lock, label: 'specs.encryption', value: 'AES-256', color: 'emerald' },
              { icon: Shield, label: 'specs.compliance', value: 'KDPA + SOC 2', color: 'blue' },
              { icon: Zap, label: 'specs.uptime', value: '99.9% SLA', color: 'amber' },
              { icon: TrendingUp, label: 'specs.scale', value: 'Event-Driven', color: 'purple' }
            ].map((spec, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center backdrop-blur-sm">
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${
                  spec.color === 'emerald' ? 'bg-emerald-500/20' :
                  spec.color === 'blue' ? 'bg-blue-500/20' :
                  spec.color === 'amber' ? 'bg-amber-500/20' :
                  'bg-purple-500/20'
                }`}>
                  <spec.icon className={`h-6 w-6 ${
                    spec.color === 'emerald' ? 'text-emerald-400' :
                    spec.color === 'blue' ? 'text-blue-400' :
                    spec.color === 'amber' ? 'text-amber-400' :
                    'text-purple-400'
                  }`} />
                </div>
                <div className="font-serif text-2xl font-bold text-white">{spec.value}</div>
                <p className="mt-2 text-sm text-slate-400">{t(spec.label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FINAL CTA SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-24 lg:py-32 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-6 py-3 text-sm font-semibold text-amber-400 border border-amber-500/20">
              <Sparkles className="h-4 w-4" />
              {t('cta.badge', 'Ready to empower your legacy?')}
            </div>

            <h2 className="font-serif text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              {t('cta.title', 'Experience Mirathi Today')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
              {t('cta.description', 'Join the growing number of Kenyan families who trust Mirathi to guide their succession journey with unparalleled intelligence and precision.')}
            </p>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="group w-full max-w-md bg-gradient-to-r from-amber-500 to-amber-600 text-lg font-bold text-slate-950 shadow-xl shadow-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/50 hover:-translate-y-1 p-0 relative overflow-hidden sm:w-auto border-0 rounded-xl"
                style={{ lineHeight: '1' }}
              >
                <div className="flex items-center justify-center gap-4 px-8 py-5">
                  <span>{t('cta.button', 'Start Your Free Trial')}</span>
                  <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                </div>
              </Button>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              {t('cta.guarantee', 'No credit card required • Comprehensive readiness assessment • Full compliance support')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CAPABILITY CARD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function CapabilityCard({ 
  icon: Icon, 
  title, 
  description,
  features,
  color,
  index
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  features: string[];
  color: string;
  index: number;
}) {
  const colorVariants: Record<string, { iconContainer: string; iconColor: string }> = {
    purple: {
      iconContainer: 'bg-purple-500/10 group-hover:bg-purple-500/20',
      iconColor: 'text-purple-400'
    },
    blue: {
      iconContainer: 'bg-blue-500/10 group-hover:bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    emerald: {
      iconContainer: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      iconColor: 'text-emerald-400'
    },
    amber: {
      iconContainer: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      iconColor: 'text-amber-400'
    },
    pink: { // New color for Event-Driven Workflow
      iconContainer: 'bg-pink-500/10 group-hover:bg-pink-500/20',
      iconColor: 'text-pink-400'
    },
    sky: { // New color for Strict Separation
      iconContainer: 'bg-sky-500/10 group-hover:bg-sky-500/20',
      iconColor: 'text-sky-400'
    }
  };

  const selectedColor = colorVariants[color] || colorVariants.purple;

  return (
    <div 
      className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-900/50"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`mb-6 inline-flex rounded-xl p-4 transition-all duration-300 group-hover:scale-110 ${selectedColor.iconContainer}`}>
        <Icon className={`h-8 w-8 ${selectedColor.iconColor}`} />
      </div>
      <h3 className="mb-3 font-serif text-xl font-bold text-white">
        {title}
      </h3>
      <p className="mb-6 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${selectedColor.iconColor}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}