import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sv from './locales/sv.json';

if (typeof window !== 'undefined' && window.localStorage) {
    try {
        const oldLang = localStorage.getItem('buymilk_language');
        if (oldLang && !localStorage.getItem('foodhero_language')) {
            localStorage.setItem('foodhero_language', oldLang);
        }
    } catch {
        // Ignore storage access errors
    }
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            sv: { translation: sv },
        },
        fallbackLng: 'sv',
        detection: {
            order: ['localStorage', 'querystring'],
            lookupLocalStorage: 'foodhero_language',
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
