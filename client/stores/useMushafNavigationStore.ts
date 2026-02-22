import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// One-time migration from legacy @recentPages key
const migrateLegacyNavigation = async () => {
    try {
        const zustandData = await AsyncStorage.getItem('mushaf-navigation');
        if (zustandData) {
            const parsed = JSON.parse(zustandData);
            if (parsed?.state?.recentPages?.length > 0) return null;
        }

        const recentPages = await AsyncStorage.getItem('@recentPages');
        if (!recentPages) return null;

        const migrated = { recentPages: JSON.parse(recentPages) };
        console.log('[Zustand Migration] Migrated legacy recentPages:', migrated.recentPages.length);
        return migrated;
    } catch (e) {
        console.error('[Zustand Migration] Nav migration failed:', e);
        return null;
    }
};

let _navMigrationPromise: Promise<any> | null = migrateLegacyNavigation();

interface MushafNavigationState {
    currentPage: number;
    isNavigating: boolean;
    showSurahList: boolean;
    navigationMode: 'surah' | 'juz' | 'recent';
    recentPages: number[];
    juzSortAsc: boolean;
    hizbGranularity: 'quarter' | 'half' | 'fullJuz';
    showGranularityPicker: boolean;
    navigationToast: string | null;
    jumpTarget: number | null; // Asymmetric Jump: when set, only mount this single page

    setCurrentPage: (page: number) => void;
    setIsNavigating: (v: boolean) => void;
    setShowSurahList: (v: boolean) => void;
    setNavigationMode: (mode: 'surah' | 'juz' | 'recent') => void;
    addRecentPage: (page: number) => void;
    setJuzSortAsc: (v: boolean) => void;
    setHizbGranularity: (v: 'quarter' | 'half' | 'fullJuz') => void;
    setShowGranularityPicker: (v: boolean) => void;
    setNavigationToast: (v: string | null) => void;
    setJumpTarget: (v: number | null) => void;
}

export const useMushafNavigationStore = create<MushafNavigationState>()(
    persist(
        (set, get) => ({
            currentPage: 1,
            isNavigating: false,
            showSurahList: false,
            navigationMode: 'surah',
            recentPages: [],
            juzSortAsc: true,
            hizbGranularity: 'quarter',
            showGranularityPicker: false,
            navigationToast: null,
            jumpTarget: null,

            setCurrentPage: (page) => set({ currentPage: page }),
            setIsNavigating: (v) => set({ isNavigating: v }),
            setShowSurahList: (v) => set({ showSurahList: v }),
            setNavigationMode: (mode) => set({ navigationMode: mode }),
            addRecentPage: (page) => {
                const { recentPages } = get();
                const filtered = recentPages.filter(p => p !== page);
                set({ recentPages: [page, ...filtered].slice(0, 20) });
            },
            setJuzSortAsc: (v) => set({ juzSortAsc: v }),
            setHizbGranularity: (v) => set({ hizbGranularity: v }),
            setShowGranularityPicker: (v) => set({ showGranularityPicker: v }),
            setNavigationToast: (v) => set({ navigationToast: v }),
            setJumpTarget: (v) => set({ jumpTarget: v }),
        }),
        {
            name: 'mushaf-navigation',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentPage: state.currentPage,
                recentPages: state.recentPages,
            }),
            onRehydrateStorage: () => {
                return async (state, error) => {
                    if (error) return;
                    if (_navMigrationPromise) {
                        const migrated = await _navMigrationPromise;
                        _navMigrationPromise = null;
                        if (migrated && state) {
                            const store = useMushafNavigationStore.getState();
                            if (store.recentPages.length === 0) {
                                useMushafNavigationStore.setState(migrated);
                                console.log('[Zustand] Legacy nav data applied');
                            }
                        }
                    }
                };
            },
        }
    )
);
