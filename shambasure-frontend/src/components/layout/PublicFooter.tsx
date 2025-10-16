// FILE: src/components/layout/PublicFooter.tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf } from 'lucide-react';

/**
 * The footer component for all public-facing pages.
 * Displays branding, copyright,
 * and links to legal documents.
 */
export function PublicFooter() {
  const { t } = useTranslation(['public_footer', 'common']);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-6 py-8 md:h-24 md:flex-row md:py-0">
        {/* Branding + Copyright */}
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-lg">{t('common:app_name')}</span>
          </Link>
          <span className="text-center text-sm leading-loose text-muted-foreground md:ml-4 md:text-left">
            &copy; {currentYear} {t('copyright')}
          </span>
        </div>

        {/* Legal Links */}
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link
            to="/privacy-policy"
            className="transition-colors hover:text-foreground"
          >
            {t('privacy_policy')}
          </Link>
          <Link
            to="/terms-of-service"
            className="transition-colors hover:text-foreground"
          >
            {t('terms_of_service')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
