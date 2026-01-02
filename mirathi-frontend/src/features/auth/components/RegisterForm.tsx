// src/features/auth/components/RegisterForm.tsx
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

import { GoogleButton } from './GoogleButton';

export function RegisterForm() {
  const { t } = useTranslation(['auth', 'common']);

  const benefits = [
    "Protect your assets & family legacy",
    "Automated legal document generation",
    "Secure digital vault for wills & deeds"
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* HEADER */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 shadow-xl shadow-amber-500/10 animate-pulse-slow">
          <Sparkles className="h-10 w-10 text-amber-400" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-3">
          {t('auth:create_account', 'Start Your Legacy')}
        </h1>
        
        <p className="text-base text-slate-400 leading-relaxed mb-6">
          {t('auth:get_started_prompt', 'Join thousands of Kenyan families securely managing their succession.')}
        </p>

        {/* BENEFITS LIST */}
        <div className="mb-8 bg-slate-900/40 rounded-xl p-5 border border-slate-800/50">
          <ul className="space-y-3 text-left">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ACTION AREA */}
      <div className="space-y-5">
        <GoogleButton text={t('auth:signup_with_google', 'Create Account with Google')} />

        <p className="text-xs text-center text-slate-500 leading-relaxed px-4">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-amber-400 hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-amber-400 hover:underline">Privacy Policy</Link>.
        </p>
      </div>

      {/* FOOTER */}
      <div className="mt-8 pt-6 border-t border-slate-800 text-center">
        <p className="text-sm text-slate-500">
          {t('auth:already_have_account', 'Already have an account?')}{' '}
          <Link 
            to="/login" 
            className="font-medium text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
          >
            {t('auth:sign_in', 'Sign In')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>
      
      {/* COMPLIANCE BADGE */}
      <div className="mt-6 flex justify-center">
         <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Encrypted & Compliant (Data Protection Act 2019)</span>
        </div>
      </div>
    </div>
  );
}