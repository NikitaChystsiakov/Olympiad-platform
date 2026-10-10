import { create } from 'zustand';
import { en } from './en';
import { ru, type PartialDictionary } from './ru';

export type Locale = 'ru' | 'en';

const LOCALE_KEY = 'olympus_locale';
const dictionaries: Record<Locale, PartialDictionary> = { ru, en };

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === 'ru' || stored === 'en') return stored;
  } catch {
    // Storage can be unavailable (private mode); fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readStoredLocale(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Ignore: the choice still applies for this session.
    }
    document.documentElement.lang = locale;
    set({ locale });
  },
}));

type Params = Record<string, string | number>;

function interpolate(template: string, params?: Params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

function lookup(dictionary: PartialDictionary, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    dictionary,
  );
  return typeof value === 'string' ? value : undefined;
}

export function translate(locale: Locale, key: string, params?: Params): string {
  const dictionary = dictionaries[locale];
  // Plural forms live under key_one / key_few / key_many / key_other.
  if (params && typeof params.count === 'number') {
    const form = new Intl.PluralRules(locale).select(params.count);
    const plural = lookup(dictionary, `${key}_${form}`) ?? lookup(dictionary, `${key}_other`);
    if (plural) return interpolate(plural, params);
  }
  const value = lookup(dictionary, key) ?? lookup(ru, key) ?? key;
  return interpolate(value, params);
}

export function useT() {
  const locale = useLocaleStore((state) => state.locale);
  return (key: string, params?: Params) => translate(locale, key, params);
}

export function useLocale() {
  return useLocaleStore((state) => state.locale);
}

/** Non-hook access for code outside components (http interceptors, stores). */
export function t(key: string, params?: Params) {
  return translate(useLocaleStore.getState().locale, key, params);
}

/** The API answers in Russian; the English UI maps known messages and falls back to a generic one. */
export function localizeServerMessage(message: string | undefined, fallbackKey = 'errors.generic') {
  const locale = useLocaleStore.getState().locale;
  if (!message) return translate(locale, fallbackKey);
  if (locale === 'ru') return message;
  return en.serverMessages[message as keyof typeof en.serverMessages] ?? translate(locale, fallbackKey);
}
