// FILE: src/pages/public/AboutPage.tsx (COMPLETE REDESIGN)
// VERSION 3: "The Legacy Journal" - Editorial, Emotional, and Authoritative

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Target, 
  HeartHandshake, 
  Users, 
  TrendingUp, 
  Heart,
  ArrowRight,
  type LucideIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

import StoryImage from '../../assets/story-image.jpg'; 

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// DATA DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const valuesData = [
  { icon: ShieldCheck, id: 'security' },
  { icon: HeartHandshake, id: 'trust' },
  { icon: Users, id: 'family' },
  { icon: Target, id: 'accessibility' },
];

const impactStatsData = [
  { value: '10,000+', id: 'families', icon: Users },
  { value: '26.2%', id: 'conflicts_prevented', icon: ShieldCheck },
  { value: '50+', id: 'counties', icon: TrendingUp },
  { value: '95%', id: 'satisfaction', icon: Heart },
];

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function AboutPage() {
  const { t } = useTranslation(['about', 'common']);
  const navigate = useNavigate();

  return (
    <div className="bg-background font-sans text-text">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HERO SECTION - Mission Statement */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="relative border-b border-neutral-200 bg-background-subtle">
        <div className="container mx-auto max-w-5xl px-6 py-24 text-center sm:py-32 lg:px-8">
          <Badge className="mb-6 border-primary/30 bg-primary/10 px-4 py-1.5 font-serif text-sm font-medium text-primary shadow-soft">
            {t('hero.badge', 'Our Story')}
          </Badge>
          <h1 className="font-display text-5xl font-bold tracking-tight text-text sm:text-6xl lg:text-7xl">
            {t('hero.title', 'Preserving Legacies,')}
            <span className="mt-2 block bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
              {t('hero.title_accent', 'Protecting Families')}
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-text-subtle sm:text-xl">
            {t('hero.subtitle', 'We believe every Kenyan family deserves to pass down their land with confidence, clarity, and peace. Shamba Sure exists to end the heartbreak of inheritance disputes and preserve generational wealth.')}
          </p>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* OUR STORY SECTION - The "Why" */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left: Emotional Image */}
            <div className="relative aspect-[4/3] rounded-elegant shadow-lifted">
              <img src={StoryImage} alt={t('story.image_alt', 'A multi-generational Kenyan family sharing a moment of joy.')} className="h-full w-full rounded-elegant object-cover" />
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-secondary/10"></div>
            </div>

            {/* Right: Origin Narrative */}
            <div>
              <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-secondary">
                {t('story.eyebrow', 'Our Journey')}
              </p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
                {t('story.title', 'How Shamba Sure Began')}
              </h2>
              <div className="prose prose-lg mt-6 max-w-none">
                <p className="text-lg leading-relaxed text-text-subtle">
                  {t('story.p1', 'Shamba Sure was born from a deeply personal experience. Our founders witnessed firsthand how a lack of proper succession planning tore apart a family they loved—siblings who once shared everything became strangers fighting over land their parents worked decades to secure.')}
                </p>
                <p className="text-lg leading-relaxed text-text-subtle">
                  {t('story.p2', 'We researched the problem and discovered it wasn\'t isolated. Across Kenya, thousands of families face the same heartbreak. The tools existed—but no one had brought them together in a way that truly served Kenyan families. So we built Shamba Sure.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* OUR VALUES SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="border-y border-neutral-200 bg-background-subtle py-20 lg:py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 font-serif text-sm font-semibold uppercase tracking-elegant text-primary">
              {t('values.eyebrow', 'What Drives Us')}
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl">
              {t('values.title', 'Our Core Values')}
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {valuesData.map((value, index) => (
              <ValueCard
                key={value.id}
                icon={value.icon}
                title={t(`values.${value.id}.title`)}
                description={t(`values.${value.id}.description`)}
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* IMPACT STATS SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="bg-secondary/5 py-20 lg:py-24">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {impactStatsData.map((stat) => (
              <StatCard
                key={stat.id}
                value={stat.value}
                label={t(`impact.${stat.id}`)}
                icon={stat.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FINAL CTA SECTION */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="font-display text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl">
            {t('cta.title', 'Join Our Mission')}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-subtle sm:text-xl">
            {t('cta.description', 'Be part of the movement to end land disputes in Kenya. Start protecting your family\'s legacy today.')}
          </p>
          <div className="mt-10">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')} 
              className="group bg-primary px-10 py-5 text-xl font-semibold text-primary-foreground shadow-elegant transition-all duration-300 hover:bg-primary-hover hover:shadow-premium"
            >
              {t('common:get_started', 'Get Started Free')}
              <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REDESIGNED SUB-COMPONENTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface ValueCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  style: React.CSSProperties;
}

function ValueCard({ icon: Icon, title, description, style }: ValueCardProps) {
  return (
    <div className="animate-fade-in rounded-elegant bg-background p-8 text-left shadow-soft transition-all duration-300 hover:shadow-lifted hover:-translate-y-2" style={style}>
      <div className="mb-5 inline-flex rounded-full bg-primary/10 p-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mb-3 font-serif text-xl font-bold text-text">{title}</h3>
      <p className="text-sm leading-relaxed text-text-subtle">{description}</p>
    </div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  icon: LucideIcon;
}

function StatCard({ value, label, icon: Icon }: StatCardProps) {
  return (
    <div className="animate-fade-in">
      <Icon className="mx-auto h-10 w-10 text-secondary" />
      <div className="mt-3 font-display text-4xl font-bold text-secondary sm:text-5xl">{value}</div>
      <p className="mt-2 text-sm font-medium text-text-subtle">{label}</p>
    </div>
  );
}
