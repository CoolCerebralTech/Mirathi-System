// FILE: src/pages/NotFoundPage.tsx

import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/Button';

/**
 * A user-friendly "404 Not Found" page that is displayed when a user
 * navigates to a URL that does not match any defined route.
 */
export function NotFoundPage() {
  const { t } = useTranslation(['common', 'not_found']);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <div className="container max-w-md p-8">
        <AlertTriangle className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">
          {t('not_found:title', 'Page Not Found')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t('not_found:description', "Sorry, we couldn't find the page you're looking for.")}
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('not_found:go_back', 'Go Back')}
          </Button>
          <Button asChild>
            <Link to="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('not_found:return_home', 'Return to Dashboard')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}