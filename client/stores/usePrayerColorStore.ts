import { create } from 'zustand';

interface PrayerColorState {
    dynamicColor: string;
    setDynamicColor: (color: string) => void;
}

export const usePrayerColorStore = create<PrayerColorState>()((set) => ({
    dynamicColor: '#4CAF50', // default fallback, overwritten by PrayerTimesScreen on mount
    setDynamicColor: (color) => set({ dynamicColor: color }),
}));
