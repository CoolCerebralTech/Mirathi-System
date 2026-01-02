import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useOAuthLogin } from '@/features/auth/auth.api';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutate: login, isError } = useOAuthLogin();
  
  // Prevent double-firing in React Strict Mode
  const processedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (processedRef.current) return;
    processedRef.current = true;

    // 1. Handle Google Errors (e.g. User clicked Cancel)
    if (error) {
      console.error('OAuth Error:', error);
      navigate('/login', { replace: true, state: { error: 'Login cancelled' } });
      return;
    }

    // 2. Handle Success Code
    if (code) {
      login(
        {
          code,
          redirectUri: window.location.origin + '/auth/callback', // Must match Google Console exactly
          provider: 'GOOGLE',
        },
        {
          onSuccess: () => {
            // Short delay to ensure cookies are set
            setTimeout(() => navigate('/dashboard', { replace: true }), 100);
          },
          onError: () => {
            navigate('/login', { replace: true, state: { error: 'Authentication failed' } });
          },
        }
      );
    } else {
      // No code? Go back to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, login]);

  if (isError) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
           <div className="text-center">
             <h3 className="text-lg font-semibold text-red-500">Login Failed</h3>
             <p className="text-slate-400">Redirecting to login...</p>
           </div>
        </div>
     )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-amber-500 animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-medium text-slate-200 animate-pulse">
          Authenticating securely...
        </h2>
        <p className="text-sm text-slate-500">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}