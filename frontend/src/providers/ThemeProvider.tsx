// FILE: src/providers/ThemeProvider.tsx

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

// We create a wrapper around the library's provider to pre-configure it
// for our application.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // Apply theme classes to the <html> element
      defaultTheme="system" // Default to the user's system preference
      enableSystem // Allow the "system" option
      disableTransitionOnChange // Prevent flashes on theme change
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}