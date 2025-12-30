// FILE: src/providers/I18nProvider.tsx

import { type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

/**
 * Provides internationalization support across the application.
 * Wraps children with the configured i18next instance.
 */
interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
