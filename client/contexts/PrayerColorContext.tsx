import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';

interface PrayerColorContextType {
    dynamicColor: string;
    setDynamicColor: (color: string) => void;
}

const PrayerColorContext = createContext<PrayerColorContextType | null>(null);

/**
 * Provider that shares the current prayer's dynamic color across the app.
 * Used by PrayerTimesScreen to set the color based on time-of-day,
 * and by MainTabNavigator to sync the active tab tint.
 */
export function PrayerColorProvider({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const [dynamicColor, setDynamicColorState] = useState(theme.primary);

    const setDynamicColor = useCallback((color: string) => {
        setDynamicColorState(color);
    }, []);

    return (
        <PrayerColorContext.Provider value={{ dynamicColor, setDynamicColor }}>
            {children}
        </PrayerColorContext.Provider>
    );
}

export function usePrayerColor(): PrayerColorContextType {
    const context = useContext(PrayerColorContext);
    const { theme } = useTheme();
    if (!context) {
        // Fallback when used outside provider
        return { dynamicColor: theme.primary, setDynamicColor: () => { } };
    }
    return context;
}
