import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, LogIn, ArrowRight, AlertCircle } from 'lucide-react';

import { GoogleButton } from './GoogleButton';

export function LoginForm() {
  const { t } = useTranslation(['auth', 'common']);
  const [searchParams] = useSearchParams();
  
  // 1. Capture Error from URL (sent by Backend)
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('message') || 'Authentication failed. Please try again.';

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* HEADER */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 shadow-xl shadow-amber-500/10">
          <LogIn className="h-10 w-10 text-amber-400" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-3">
          {t('auth:welcome_back', 'Welcome Back')}
        </h1>
        
        <p className="text-base text-slate-400 leading-relaxed mb-8">
          {t('auth:sign_in_prompt', 'Sign in to access your succession planning dashboard.')}
        </p>

        {/* 2. ERROR DISPLAY */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-red-400">
                {error === 'oauth_failed' ? 'Login Failed' : 'Access Denied'}
              </h4>
              <p className="text-xs text-red-300/80">
                {error === 'oauth_failed' 
                  ? 'We could not sign you in with Google. If you have an existing account, please contact support.' 
                  : errorDescription}
              </p>
            </div>
          </div>
        )}

        {/* GOOGLE LOGIN */}
        <div className="space-y-4">
          <GoogleButton text={t('auth:continue_with_google', 'Sign in with Google')} />
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-3 font-medium text-slate-600">
                {t('auth:secure_access', 'Secure Access')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER LINKS */}
      <div className="text-center space-y-6">
        <p className="text-sm text-slate-500">
          {t('auth:new_user_question', "Don't have an account?")}{' '}
          <Link 
            to="/register" 
            className="font-medium text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
          >
            {t('auth:create_account', 'Get Started')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </p>

        {/* SECURITY BADGE */}
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-4 mx-auto max-w-sm">
          <p className="flex items-start justify-center gap-2 text-xs leading-relaxed text-slate-500">
            <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
            <span>
              {t('auth:security_notice', 'We use bank-level encryption to protect your family\'s legacy.')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}