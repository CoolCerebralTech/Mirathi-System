import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface PasswordRequirementsProps {
  /** The password string to evaluate */
  password: string;
  /** Whether the checklist should be visible */
  show: boolean;
}

/**
 * A checklist component that shows password requirements and indicates
 * which ones have been met by the current password input.
 */
export function PasswordRequirements({ password, show }: PasswordRequirementsProps) {
  const { t } = useTranslation(['auth']);

  if (!show) {
    return null;
  }

  const requirements = [
    {
      met: password.length >= 8,
      label: t('auth:password_req_length', 'At least 8 characters'),
    },
    {
      met: /[A-Z]/.test(password),
      label: t('auth:password_req_uppercase', 'One uppercase letter (A-Z)'),
    },
    {
      met: /[a-z]/.test(password),
      label: t('auth:password_req_lowercase', 'One lowercase letter (a-z)'),
    },
    {
      met: /[0-9]/.test(password),
      label: t('auth:password_req_number', 'One number (0-9)'),
    },
    {
      met: /[^A-Za-z0-9]/.test(password),
      label: t('auth:password_req_special', 'One special character (!@#$)'),
    },
  ];

  return (
    <div
      className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-background-subtle p-4 text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50"
      aria-live="polite"
    >
      <p className="flex items-center gap-1.5 font-semibold text-text">
        <Info size={14} />
        {t('auth:password_requirements', 'Your password must contain:')}
      </p>
      <ul className="space-y-1.5 pl-1">
        {requirements.map((req) => (
          <li
            key={req.label}
            className={`flex items-center gap-2 transition-colors duration-300 ${
              req.met ? 'text-secondary' : 'text-text-muted'
            }`}
          >
            {req.met ? (
              <CheckCircle2 size={14} className="flex-shrink-0" />
            ) : (
              // Using XCircle for unmet requirements is clearer than an empty circle
              <XCircle size={14} className="flex-shrink-0 text-neutral-400" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}