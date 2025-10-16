// FILE: src/providers/ThemeProvider.tsx

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

/**
 * Application-wide theme provider.
 *
 * - Uses `class` attribute for Tailwind CSS dark mode support.
 * - Defaults to system preference.
 * - Persists theme preference in localStorage under the key "shamba-sure-theme".
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="shamba-sure-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
