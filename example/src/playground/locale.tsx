import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { PlaygroundLocale } from "./routes";

const PLAYGROUND_LOCALE_KEY = "comins-grid-layout-playground-locale";

export type LocalizedText = Readonly<{
  en: string;
  ko: string;
}>;

type PlaygroundLocaleContextValue = {
  locale: PlaygroundLocale;
  setLocale: Dispatch<SetStateAction<PlaygroundLocale>>;
  text: (ko: string, en: string) => string;
};

const PlaygroundLocaleContext = createContext<PlaygroundLocaleContextValue | null>(null);

export function PlaygroundLocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<PlaygroundLocale>(readPlaygroundLocale);
  const value = useMemo<PlaygroundLocaleContextValue>(() => ({
    locale,
    setLocale,
    text: (ko, en) => locale === "ko" ? ko : en,
  }), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(PLAYGROUND_LOCALE_KEY, locale);
    } catch {
      // The in-memory locale remains usable when storage is unavailable.
    }
  }, [locale]);

  return <PlaygroundLocaleContext.Provider value={value}>{children}</PlaygroundLocaleContext.Provider>;
}

export function usePlaygroundLocale(): PlaygroundLocaleContextValue {
  const context = useContext(PlaygroundLocaleContext);
  if (!context) {
    throw new Error("playground-localization: missing PlaygroundLocaleProvider");
  }
  return context;
}

export function resolveLocalizedText(copy: LocalizedText, locale: PlaygroundLocale): string {
  return copy[locale];
}

function readPlaygroundLocale(): PlaygroundLocale {
  try {
    return window.localStorage.getItem(PLAYGROUND_LOCALE_KEY) === "en" ? "en" : "ko";
  } catch {
    return "ko";
  }
}
