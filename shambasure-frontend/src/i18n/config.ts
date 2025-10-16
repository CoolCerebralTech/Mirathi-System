// FILE: src/i18n/config.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import ALL English translations
import enAbout from './locales/en/about.json';
import enAssets from './locales/en/assets.json';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enContact from './locales/en/contact.json';
import enDashboard from './locales/en/dashboard.json';
import enDocuments from './locales/en/documents.json';
import enFamilies from './locales/en/families.json';
import enFeatures from './locales/en/features.json';
import enHeader from './locales/en/header.json';
import enHome from './locales/en/home.json';
import enNotFound from './locales/en/not_found.json';
import enPublicFooter from './locales/en/public_footer.json';
import enPublicHeader from './locales/en/public_header.json';
import enSettings from './locales/en/settings.json';
import enSidebar from './locales/en/sidebar.json';
import enUser from './locales/en/user.json';
import enValidation from './locales/en/validation.json';
import enWills from './locales/en/wills.json';

// Import ALL Swahili translations
import swAbout from './locales/sw/about.json';
import swAssets from './locales/sw/assets.json';
import swAuth from './locales/sw/auth.json';
import swCommon from './locales/sw/common.json';
import swContact from './locales/sw/contact.json';
import swDashboard from './locales/sw/dashboard.json';
import swDocuments from './locales/sw/documents.json';
import swFamilies from './locales/sw/families.json';
import swFeatures from './locales/sw/features.json';
import swHeader from './locales/sw/header.json';
import swHome from './locales/sw/home.json';
import swNotFound from './locales/sw/not_found.json';
import swPublicFooter from './locales/sw/public_footer.json';
import swPublicHeader from './locales/sw/public_header.json';
import swSettings from './locales/sw/settings.json';
import swSidebar from './locales/sw/sidebar.json';
import swUser from './locales/sw/user.json';
import swValidation from './locales/sw/validation.json';
import swWills from './locales/sw/wills.json';

// Define the complete resource bundle
const resources = {
  en: {
    about: enAbout, assets: enAssets, auth: enAuth, common: enCommon, contact: enContact,
    dashboard: enDashboard, documents: enDocuments, families: enFamilies, features: enFeatures,
    header: enHeader, home: enHome, not_found: enNotFound, public_footer: enPublicFooter,
    public_header: enPublicHeader, settings: enSettings, sidebar: enSidebar, user: enUser,
    validation: enValidation, wills: enWills,
  },
  sw: {
    about: swAbout, assets: swAssets, auth: swAuth, common: swCommon, contact: swContact,
    dashboard: swDashboard, documents: swDocuments, families: swFamilies, features: swFeatures,
    header: swHeader, home: swHome, not_found: swNotFound, public_footer: swPublicFooter,
    public_header: swPublicHeader, settings: swSettings, sidebar: swSidebar, user: swUser,
    validation: swValidation, wills: swWills,
  },
};

// Define the complete list of all namespaces used in the app
const allNamespaces = [
  'about', 'assets', 'auth', 'common', 'contact', 'dashboard', 'documents',
  'families', 'features', 'header', 'home', 'not_found', 'public_footer',
  'public_header', 'settings', 'sidebar', 'user', 'validation', 'wills',
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns: allNamespaces,
    defaultNS: 'common',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'shamba-sure-language',
    },
  });

export default i18n;