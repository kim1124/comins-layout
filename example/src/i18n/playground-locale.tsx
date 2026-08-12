import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";

import type { LocalizedText, PlaygroundLocale } from "./types";

export const PLAYGROUND_LOCALE_STORAGE_KEY = "comins-grid-layout-playground-locale";

type PlaygroundLocaleContextValue = {
  locale: PlaygroundLocale;
  setLocale: Dispatch<SetStateAction<PlaygroundLocale>>;
  text: (copy: LocalizedText) => string;
};

const PlaygroundLocaleContext = createContext<PlaygroundLocaleContextValue | null>(null);

export function normalizePlaygroundLocale(value: string | null): PlaygroundLocale {
  return value === "en" || value === "ko" ? value : "ko";
}

export function defineLocalizedText(ko: string, en: string): LocalizedText {
  if (!ko.trim() || !en.trim()) {
    throw new Error("playground-localization: incomplete localized text");
  }

  return Object.freeze({ en, ko });
}

export function resolveLocalizedText(value: LocalizedText, locale: PlaygroundLocale): string {
  if (!value.ko.trim() || !value.en.trim()) {
    throw new Error("playground-localization: incomplete localized text");
  }

  return value[locale];
}

function readStoredLocale(): PlaygroundLocale {
  try {
    return normalizePlaygroundLocale(window.localStorage.getItem(PLAYGROUND_LOCALE_STORAGE_KEY));
  } catch {
    return "ko";
  }
}

export function PlaygroundLocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<PlaygroundLocale>(readStoredLocale);
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      text: (copy: LocalizedText) => resolveLocalizedText(copy, locale),
    }),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(PLAYGROUND_LOCALE_STORAGE_KEY, locale);
    } catch {
      // In-memory locale remains usable when storage is unavailable.
    }
  }, [locale]);

  return <PlaygroundLocaleContext.Provider value={value}>{children}</PlaygroundLocaleContext.Provider>;
}

export function usePlaygroundLocale(): PlaygroundLocaleContextValue {
  const context = useContext(PlaygroundLocaleContext);
  if (!context) {
    throw new Error("playground-localization: usePlaygroundLocale must be used within PlaygroundLocaleProvider");
  }

  return context;
}
