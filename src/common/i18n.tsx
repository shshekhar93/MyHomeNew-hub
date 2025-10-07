import { createContext, PropsWithChildren, useCallback, useContext } from 'react';
import { useStoreUpdates } from './hooks.js';

export type Translations = Record<string, string>;
const I18nContext = createContext<Translations>({});

const I18nProvider = ({ children }: PropsWithChildren) => {
  const [translations] = useStoreUpdates<[Translations]>(['translations']);
  return (
    <I18nContext.Provider value={translations}>{children}</I18nContext.Provider>
  );
};

const useTranslations = () => {
  const translations = useContext(I18nContext);
  return useCallback(
    (id: string, values: Record<string, string> = {}) => {
      const translation = translations && translations[id];

      if (!translation) {
        return `☃${id}☃`;
      }

      const placeholders = Array.from(translation.match(/{.+?}/g) || []);
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
