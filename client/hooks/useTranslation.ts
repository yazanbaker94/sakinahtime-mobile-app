import { useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

/**
 * Hook to access translation function and locale info.
 * 
 * Usage:
 *   const { t, locale, isRTL } = useTranslation();
 *   <ThemedText>{t('settings.appearance')}</ThemedText>
 */
export function useTranslation() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
}
