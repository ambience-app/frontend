import { useTranslation } from 'react-i18next';

type NestedObject = {
  [key: string]: string | NestedObject;
};

/**
 * Custom hook for type-safe translations
 * @param {string} ns - The namespace to use for translations
 * @returns {Function} - A function to get translated strings
 */
export function useTranslations(ns: string) {
  const { t, i18n } = useTranslation(ns);
  
  /**
   * Get a translated string with type safety
   * @param {string} key - The translation key (e.g., 'app.title')
   * @param {Record<string, any>} [options] - Optional variables for interpolation
   * @returns {string} - The translated string
   */
  const tKey = (key: string, options?: Record<string, any>): string => {
    return t(key, options) as string;
  };

  return {
    t: tKey,
    i18n,
    ready: i18n.isInitialized,
    language: i18n.language,
  };
}

/**
 * Hook to get the current language and change language function
 * @returns {Object} - Object with current language and changeLanguage function
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    return i18n.changeLanguage(lng);
  };

  return {
    language: i18n.language,
    changeLanguage,
    languages: ['en', 'es', 'fr'],
  };
}
