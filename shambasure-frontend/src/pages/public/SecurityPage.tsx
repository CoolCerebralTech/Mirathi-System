import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Lock, 
  ShieldCheck, 
  Fingerprint,
  Award,
  Eye,
  Server,
  FileCheck,
  CheckCircle2,
  Shield,
  ArrowRight,
  Database,
  Key,
  Globe,
  AlertTriangle,
  UserCheck,
  Clock
} from 'lucide-react';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type ColorVariant = 'emerald' | 'amber' | 'blue' | 'purple';

interface SecurityFeatureItem {
  icon: React.ElementType;
  id: string;
  title: string;
  description: string;
  badge: string;
  color: ColorVariant;
  details: string[];
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// DATA
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const securityFeatures: SecurityFeatureItem[] = [
  { 
    icon: Lock, 
    id: 'encryption',
    title: 'Military-Grade Encryption',
    description: 'Every document, every asset detail, every family record is protected with AES-256 encryption—the same standard used by banks and governments worldwide.',
    badge: 'At Rest & In Transit',
    color: 'emerald',
    details: [
      'TLS 1.3 for all data transmission',
      'Zero-knowledge architecture for sensitive files',
      'Encrypted database fields for PII',
      'Secure key rotation every 90 days'
    ]
  },
  { 
    icon: Server, 
    id: 'sovereignty',
    title: 'Your Data Never Leaves Kenya',
    description: 'Full compliance with Kenya\'s Data Protection Act 2019. All sensitive information is stored within Kenyan jurisdiction or legally compliant zones.',
    badge: 'KDPA 2019 Compliant',
    color: 'amber',
    details: [
      'Data residency in approved Kenyan zones',
      'No third-party data sharing',
      'Right to data portability honored',
      'Transparent privacy policies'
    ]
  },
  { 
    icon: Fingerprint, 
    id: 'rbac',
    title: 'Strict Access Control',
    description: 'Not even Mirathi employees can access your data without explicit authorization. Our Role-Based Access Control ensures only YOU decide who sees what.',
    badge: 'Zero Trust Model',
    color: 'blue',
    details: [
      'Multi-factor authentication (MFA)',
      'Biometric verification options',
      'Session timeout protection',
      'Granular permission controls'
    ]
  },
  { 
    icon: Eye, 
    id: 'audit',
    title: 'Complete Audit Trail',
    description: 'Every action is logged. Every change is tracked. If anyone accesses your data, you\'ll know who, when, and why—with immutable records.',
    badge: 'Forensic-Ready',
    color: 'purple',
    details: [
      'Real-time activity monitoring',
      'Tamper-proof audit logs',
      'Instant breach alerts',
      'Annual security reports'
    ]
  },
];

const complianceBadges = [
  { 
    icon: Award, 
    title: 'Data Protection Act 2019', 
    description: 'Full compliance with Kenya\'s DPA regulations for personal data processing.',
    color: 'emerald'
  },
  { 
    icon: Shield, 
    title: 'SOC 2 Type II', 
    description: 'Infrastructure built on certified providers with rigorous security audits.',
    color: 'blue'
  },
  { 
    icon: FileCheck, 
    title: 'Law of Succession Act', 
    description: 'Workflows designed to meet Cap 160 legal standards and court requirements.',
    color: 'purple'
  },
  { 
    icon: Database, 
    title: 'Redundant Backups', 
    description: 'Point-in-time recovery with 99.99% data durability guarantee.',
    color: 'amber'
  },
];

const securityPromises = [
  {
    icon: UserCheck,
    title: 'We Never Sell Your Data',
    description: 'Your family\'s information is sacred. We will never sell, rent, or share your data with third parties for marketing purposes. Our business model is subscription-based—not data exploitation.'
  },
  {
    icon: Lock,
    title: 'Encryption is Non-Negotiable',
    description: 'Even if someone physically steals our servers, your data remains encrypted and unreadable. We use industry-leading encryption protocols with no backdoors.'
  },
  {
    icon: Globe,
    title: 'You Own Your Data',
    description: 'You can export your entire succession plan at any time. You can delete your account and all associated data. Your data is yours, not ours.'
  },
  {
    icon: Clock,
    title: 'Transparent Incident Response',
    description: 'In the unlikely event of a security incident, we commit to notifying affected users within 72 hours and providing clear remediation steps.'
  },
];

const securityFaqs = [
  { 
    question: 'Can Mirathi employees see my Will?',
    answer: 'No. Your documents are encrypted at rest using keys that only you control. When verification is required, our trained Verifiers can only view specific documents you\'ve submitted for validation, with Personally Identifiable Information (PII) automatically redacted where possible. They cannot access your entire estate or family data.'
  },
  { 
    question: 'Where exactly is my data stored?',
    answer: 'Your data is stored in secure, redundant cloud facilities that comply with the Kenyan Data Protection Act 2019. We use infrastructure providers with Kenyan data residency certifications or approved cross-border data transfer agreements. You can request a detailed data residency report from our support team.'
  },
  { 
    question: 'What happens if Mirathi is hacked?',
    answer: 'We use a defense-in-depth strategy with multiple security layers. Even if one service is compromised, our microservices architecture limits the blast radius. Sensitive data like passwords (salted & hashed) and documents (encrypted) remain protected. We also maintain comprehensive cyber insurance and have an incident response team on standby 24/7.'
  },
  {
    question: 'How do you handle my family members\' data?',
    answer: 'When you add family members to your succession plan, we collect only the minimum necessary information. They receive notification and can claim their profile to control their own data. We comply with consent requirements under the Data Protection Act for processing family members\' information.'
  },
  {
    question: 'Can the government access my data?',
    answer: 'We only disclose data in response to valid legal orders (court warrants, subpoenas) as required by Kenyan law. We do not provide blanket access to any government agency. If we receive a request, we notify affected users unless legally prohibited, and we challenge overly broad requests.'
  },
];

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function SecurityPage() {
  const { t } = useTranslation(['security', 'common']); 
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  return (
    <div className="bg-slate-950 font-sans text-slate-100">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
        <div className="absolute inset-0 opacity-[0.05]">
           <div className="absolute inset-0" style={{
             backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}></div>
        </div>

        <div className="container relative mx-auto px-6 py-20 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-100">
                {t('hero.badge', 'Bank-Grade Security Architecture')}
              </span>
            </div>
            
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t('hero.title', 'Your Family\'s Legacy')}
              <span className="mt-2 block bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                {t('hero.subtitle', 'Protected Like Fort Knox')}
              </span>
            </h1>
            
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              {t('hero.description', 'When you trust Mirathi with your succession plan, we protect it with the same rigor as a bank protects your money. Military-grade encryption, zero-trust architecture, and complete transparency.')}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0 rounded-lg bg-emerald-500/10 p-3">
                    <Key className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">AES-256</h3>
                    <p className="text-sm text-slate-400">Military-Grade Encryption</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0 rounded-lg bg-emerald-500/10 p-3">
                    <Globe className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">100% Kenya</h3>
                    <p className="text-sm text-slate-400">KDPA 2019 Compliant</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-left">
                  <div className="flex-shrink-0 rounded-lg bg-emerald-500/10 p-3">
                    <Eye className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Zero Access</h3>
                    <p className="text-sm text-slate-400">You Control Who Sees What</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SECURITY FEATURES - Detailed */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32 bg-slate-950">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-emerald-500">
              {t('features.eyebrow', 'Defense in Depth')}
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('features.title', 'Security at Every Layer')}
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-400">
              {t('features.description', 'From the moment you log in to the moment your data is stored, every interaction is protected by multiple security layers.')}
            </p>
          </div>

          <div className="space-y-16">
            {securityFeatures.map((feature, index) => (
              <SecurityFeatureCard
                key={feature.id}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* COMPLIANCE BADGES */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
             <span className="text-sm font-bold uppercase tracking-widest text-amber-500">
               {t('compliance.eyebrow', 'Regulatory Excellence')}
             </span>
            <h2 className="mt-4 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('compliance.title', 'Compliance You Can Trust')}
            </h2>
            <p className="mx-auto mt-6 text-lg leading-relaxed text-slate-400">
              {t('compliance.description', 'We don\'t just meet legal requirements—we exceed them. Our compliance framework is built for the long term.')}
            </p>
          </div>

          <div className="mx-auto max-w-6xl grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {complianceBadges.map((badge, index) => (
              <div 
                key={index}
                className="group rounded-2xl bg-slate-950 p-8 text-center border border-slate-800 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
              >
                <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
                  badge.color === 'emerald' ? 'bg-emerald-500/10' :
                  badge.color === 'blue' ? 'bg-blue-500/10' :
                  badge.color === 'purple' ? 'bg-purple-500/10' :
                  'bg-amber-500/10'
                } border border-slate-800 group-hover:border-emerald-500/50 transition-all`}>
                  <badge.icon className={`h-8 w-8 ${
                    badge.color === 'emerald' ? 'text-emerald-400' :
                    badge.color === 'blue' ? 'text-blue-400' :
                    badge.color === 'purple' ? 'text-purple-400' :
                    'text-amber-400'
                  }`} />
                </div>
                <h3 className="mb-2 font-bold text-white">{badge.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SECURITY PROMISES */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32 bg-slate-950">
        <div className="container mx-auto max-w-5xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t('promises.title', 'Our Security Charter')}
            </h2>
            <p className="mt-6 text-lg text-slate-400">
              {t('promises.description', 'These are the non-negotiable commitments we make to every Mirathi user.')}
            </p>
          </div>

          <div className="space-y-8">
            {securityPromises.map((promise, index) => (
              <div 
                key={index}
                className="group flex gap-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-900"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <promise.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-2">
                    {promise.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {promise.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FAQ SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-t border-slate-800 bg-slate-900 py-20 lg:py-32">
        <div className="container mx-auto max-w-4xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="font-serif text-4xl font-bold text-white">
              {t('faq.title', 'Common Security Questions')}
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              {t('faq.description', 'Honest answers to the questions you\'re probably thinking about.')}
            </p>
          </div>
          
          <div className="space-y-4">
            {securityFaqs.map((faq, index) => (
              <div 
                key={index}
                className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-900/50 transition-colors"
                >
                  <span className="font-semibold text-white pr-4">{faq.question}</span>
                  <ArrowRight 
                    className={`h-5 w-5 text-emerald-400 flex-shrink-0 transition-transform duration-300 ${
                      expandedFaq === index ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h3 className="font-bold text-xl text-white mb-2">
              {t('cta.security_concern', 'Have a Specific Security Concern?')}
            </h3>
            <p className="text-slate-400 mb-6">
              {t('cta.security_concern_desc', 'Our security team is here to answer any questions you have about how we protect your data.')}
            </p>
            <button 
              onClick={() => navigate('/contact')}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition-all hover:bg-amber-400"
            >
              Contact Security Team
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/50 px-8 py-4 font-semibold text-white transition-all hover:bg-slate-800 hover:border-emerald-500/50"
            >
              Start Secure Registration
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SECURITY FEATURE CARD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface SecurityFeatureCardProps {
  feature: SecurityFeatureItem;
  index: number;
}

function SecurityFeatureCard({ feature, index }: SecurityFeatureCardProps) {
  const colorClasses: Record<ColorVariant, {
    border: string;
    bg: string;
    icon: string;
    badge: string;
  }> = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'bg-emerald-500/5',
      icon: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bg: 'bg-amber-500/5',
      icon: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'bg-blue-500/5',
      icon: 'text-blue-400',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bg: 'bg-purple-500/5',
      icon: 'text-purple-400',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    }
  };

  const colors = colorClasses[feature.color];
  const isReversed = index % 2 === 1;

  return (
    <div className={`grid gap-12 lg:grid-cols-2 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
      <div className={isReversed ? 'order-2' : 'order-2 lg:order-1'}>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border mb-4 ${colors.badge}`}>
          <feature.icon className="h-4 w-4" />
          {feature.badge}
        </div>
        <h3 className="font-serif text-3xl font-bold text-white mb-4">
          {feature.title}
        </h3>
        <p className="text-lg text-slate-400 leading-relaxed mb-8">
          {feature.description}
        </p>
        <ul className="space-y-3">
          {feature.details.map((detail, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
              <span className="text-slate-300">{detail}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={isReversed ? 'order-1' : 'order-1 lg:order-2'}>
        <div className={`rounded-2xl border p-12 ${colors.border} ${colors.bg} transition-all duration-300`}>
          <div className="flex items-center justify-center">
            <feature.icon className={`h-32 w-32 ${colors.icon}`} />
          </div>
        </div>
      </div>
    </div>
  );
}