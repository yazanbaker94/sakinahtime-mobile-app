import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioService from '@/services/AudioService';

interface MushafAudioState {
    showPlayMenu: boolean;
    isLoading: boolean;
    showSpeedMenu: boolean;
    showAudioSettings: boolean;
    showReciterPicker: boolean;
    playUntil: 'verse' | 'surah' | 'page' | 'juz';
    selectedReciter: string;
    reciterSearch: string;
    isPlayerMinimized: boolean;
    audioState: any;

    setShowPlayMenu: (v: boolean) => void;
    setIsLoading: (v: boolean) => void;
    setShowSpeedMenu: (v: boolean) => void;
    setShowAudioSettings: (v: boolean) => void;
    setShowReciterPicker: (v: boolean) => void;
    setPlayUntil: (v: 'verse' | 'surah' | 'page' | 'juz') => void;
    setSelectedReciter: (v: string) => void;
    setReciterSearch: (v: string) => void;
    setIsPlayerMinimized: (v: boolean) => void;
    setAudioState: (v: any) => void;
}

export const useMushafAudioStore = create<MushafAudioState>()(
    persist(
        (set) => ({
            showPlayMenu: false,
            isLoading: false,
            showSpeedMenu: false,
            showAudioSettings: false,
            showReciterPicker: false,
            playUntil: 'surah',
            selectedReciter: 'Alafasy_128kbps',
            reciterSearch: '',
            isPlayerMinimized: false,
            audioState: null,

            setShowPlayMenu: (v) => set({ showPlayMenu: v }),
            setIsLoading: (v) => set({ isLoading: v }),
            setShowSpeedMenu: (v) => set({ showSpeedMenu: v }),
            setShowAudioSettings: (v) => set({ showAudioSettings: v }),
            setShowReciterPicker: (v) => set({ showReciterPicker: v }),
            setPlayUntil: (v) => set({ playUntil: v }),
            setSelectedReciter: (v) => set({ selectedReciter: v }),
            setReciterSearch: (v) => set({ reciterSearch: v }),
            setIsPlayerMinimized: (v) => set({ isPlayerMinimized: v }),
            setAudioState: (v) => set({ audioState: v }),
        }),
        {
            name: 'mushaf-audio',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist user preferences, not transient UI state
            partialize: (state) => ({
                playUntil: state.playUntil,
                selectedReciter: state.selectedReciter,
            }),
            // Sync AudioService with persisted reciter on app startup
            onRehydrateStorage: () => (state) => {
                if (state?.selectedReciter) {
                    AudioService.setReciter(state.selectedReciter);
                }
            },
        }
    )
);
