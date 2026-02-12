import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { i18n, SupportedLocale, isRTL as checkRTL, SUPPORTED_LANGUAGES } from '@/i18n';
import { getLocales } from 'expo-localization';

// Force LTR — we don't use global RTL since Quran/azkar handle their own direction
if (I18nManager.isRTL) {
    I18nManager.forceRTL(false);
    I18nManager.allowRTL(false);
}

const LANGUAGE_STORAGE_KEY = '@sakinah_language';

interface LanguageContextType {
    locale: SupportedLocale;
    setLocale: (locale: SupportedLocale) => Promise<void>;
    isRTL: boolean;
    t: (key: string, options?: Record<string, any>) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    setLocale: async () => { },
    isRTL: false,
    t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<SupportedLocale>('en');
    const [isReady, setIsReady] = useState(false);

    // Load saved language on mount
    useEffect(() => {
        async function loadLanguage() {
            try {
                const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
                    const savedLocale = saved as SupportedLocale;
                    i18n.locale = savedLocale;
                    setLocaleState(savedLocale);
                } else {
                    // Auto-detect device language
                    const deviceLang = getLocales()[0]?.languageCode ?? 'en';
                    const supported = SUPPORTED_LANGUAGES.find(l => l.code === deviceLang);
                    const detectedLocale = supported ? supported.code : 'en';
                    i18n.locale = detectedLocale;
                    setLocaleState(detectedLocale as SupportedLocale);
                }
            } catch {
                // Keep default English
            }
            setIsReady(true);
        }
        loadLanguage();
    }, []);

    const setLocale = useCallback(async (newLocale: SupportedLocale) => {
        i18n.locale = newLocale;
        setLocaleState(newLocale);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
        // Note: We intentionally do NOT force RTL layout direction.
        // The Quran, azkar, and duas screens already handle Arabic text
        // direction natively, and forcing global RTL would break them.
    }, []);

    const t = useCallback((key: string, options?: Record<string, any>) => {
        return i18n.t(key, options);
    }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isReady) return null;

    return (
        <LanguageContext.Provider value={{ locale, setLocale, isRTL: checkRTL(locale), t }}>
            {children}
        </LanguageContext.Provider>
    );
}
