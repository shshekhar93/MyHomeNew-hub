import { createContext, useCallback, useContext } from 'react';
import { useStoreUpdates } from './hooks.js';

const I18nContext = createContext();

const I18nProvider = ({ children }) => {
  const [translations] = useStoreUpdates(['translations']);
  return (
    <I18nContext.Provider value={translations}>{children}</I18nContext.Provider>
  );
};

const useTranslations = () => {
  const translations = useContext(I18nContext);
  return useCallback(
    (id, values = {}) => {
      const translation = translations && translations[id];

      if (!translation) {
        return `☃${id}☃`;
      }

      const placeholders = translation.match(/{.+?}/g) || [];
      return placeholders.reduce(
        (str, placeholder) =>
          str.replace(
            placeholder,
            values[placeholder.substring(1, placeholder.length - 1)],
          ),
        translation,
      );
    },
    [translations],
  );
};

export { I18nProvider, useTranslations };
