import { useTranslation } from 'react-i18next';
import { calculatePasswordStrength } from '../../types';

interface PasswordStrengthIndicatorProps {
  /** The password string to evaluate */
  password: string;
}

/**
 * A visual component that displays the strength of a given password
 * with a colored bar and descriptive text.
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation(['auth']);
  const strength = calculatePasswordStrength(password);

  // Don't render anything if there is no password
  if (!password) {
    return null;
  }

  const strengthConfig = {
    weak: {
      label: t('auth:password_weak', 'Weak'),
      color: 'bg-danger',
      width: 'w-1/4',
      textColor: 'text-danger',
      value: 25,
    },
    medium: {
      label: t('auth:password_medium', 'Fair'),
      color: 'bg-warning',
      width: 'w-2/4',
      textColor: 'text-warning',
      value: 50,
    },
    strong: {
      label: t('auth:password_strong', 'Good'),
      color: 'bg-secondary',
      width: 'w-3/4',
      textColor: 'text-secondary',
      value: 75,
    },
    'very-strong': {
      label: t('auth:password_very_strong', 'Excellent'),
      color: 'bg-secondary', // Using the same color as "Good" for a consistent positive look
      width: 'w-full',
      textColor: 'text-secondary',
      value: 100,
    },
  } as const satisfies Record<string, { label: string; color: string; width: string; textColor: string; value: number }>;

  const config = strengthConfig[strength as keyof typeof strengthConfig];

  return (
    <div className="space-y-1.5 pt-1" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{t('auth:password_strength', 'Password Strength')}</span>
        <span className={`font-medium ${config.textColor}`}>{config.label}</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={config.value}
        aria-label={`${t('auth:password_strength', 'Password Strength')}: ${config.label}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${config.color} ${config.width}`}
        />
      </div>
    </div>
  );
}