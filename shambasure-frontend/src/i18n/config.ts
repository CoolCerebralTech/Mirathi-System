// FILE: src/i18n/config.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enAssets from './locales/en/assets.json';
import enWills from './locales/en/wills.json';
import enFamilies from './locales/en/families.json';
import enDocuments from './locales/en/documents.json';
import enValidation from './locales/en/validation.json';

import swCommon from './locales/sw/common.json';
import swAuth from './locales/sw/auth.json';
import swDashboard from './locales/sw/dashboard.json';
import swAssets from './locales/sw/assets.json';
import swWills from './locales/sw/wills.json';
import swFamilies from './locales/sw/families.json';
import swDocuments from './locales/sw/documents.json';
import swValidation from './locales/sw/validation.json';

// Define resources
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    assets: enAssets,
    wills: enWills,
    families: enFamilies,
    documents: enDocuments,
    validation: enValidation,
  },
  sw: {
    common: swCommon,
    auth: swAuth,
    dashboard: swDashboard,
    assets: swAssets,
    wills: swWills,
    families: swFamilies,
    documents: swDocuments,
    validation: swValidation,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'assets', 'wills', 'families', 'documents', 'validation'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'shamba-sure-language',
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
