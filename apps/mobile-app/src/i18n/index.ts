import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';
import type { Language } from '@/types';

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export const setI18nLanguage = (lang: Language) => {
  void i18n.changeLanguage(lang);
};

export default i18n;
