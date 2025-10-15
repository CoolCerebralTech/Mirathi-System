// FILE: src/providers/ThemeProvider.tsx

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';


// ============================================================================
// THEME PROVIDER
// ============================================================================

/**
 * Wraps the application with the NextThemesProvider to enable theme switching.
 * - Uses `class` attribute for Tailwind CSS compatibility.
 * - Default theme is set to "system".
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
