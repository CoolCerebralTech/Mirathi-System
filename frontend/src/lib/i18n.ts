// src/lib/i18n.ts
// ============================================================================
// Internationalization (i18n) Configuration
// ============================================================================
// - Initializes the i18next library for multi-language support.
// - Loads translation files for English (en) and Swahili (sw).
// - Uses i18next-browser-languagedetector to automatically set the initial
// language based on the user's browser preferences.
// - Sets a fallback language ('en') in case a translation is missing.
// ============================================================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// Import our translation files
import en from '../locales/en.json';
import sw from '../locales/sw.json';
i18n
// Detect user language
.use(LanguageDetector)
// Pass the i18n instance to react-i18next.
.use(initReactI18next)
// Initialize i18next
.init({
// We init with resources
resources: {
en: { ...en },
sw: { ...sw },
},
// The default language to use
fallbackLng: 'en',
// Debugging output in the console
debug: process.env.NODE_ENV === 'development',
interpolation: {
  escapeValue: false, // React already safes from xss
},
});
export default i18n;