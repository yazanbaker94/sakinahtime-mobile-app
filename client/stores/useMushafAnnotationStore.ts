import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// One-time migration from legacy AsyncStorage keys to Zustand store
const migrateLegacyAnnotations = async () => {
    try {
        // Check if migration already happened
        const zustandData = await AsyncStorage.getItem('mushaf-annotations');
        if (zustandData) {
            const parsed = JSON.parse(zustandData);
            if (parsed?.state?.bookmarks?.length > 0 || Object.keys(parsed?.state?.highlights || {}).length > 0) {
                return null;
            }
        }

        const [bookmarks, highlights, highlightTimestamps, notes, noteTimestamps] = await Promise.all([
            AsyncStorage.getItem('@bookmarks'),
            AsyncStorage.getItem('@highlights'),
            AsyncStorage.getItem('@highlightTimestamps'),
            AsyncStorage.getItem('@notes'),
            AsyncStorage.getItem('@noteTimestamps'),
        ]);

        const hasLegacyData = bookmarks || highlights || notes;
        if (!hasLegacyData) return null;

        const migrated = {
            bookmarks: bookmarks ? JSON.parse(bookmarks) : [],
            highlights: highlights ? JSON.parse(highlights) : {},
            highlightTimestamps: highlightTimestamps ? JSON.parse(highlightTimestamps) : {},
            notes: notes ? JSON.parse(notes) : {},
            noteTimestamps: noteTimestamps ? JSON.parse(noteTimestamps) : {},
        };

        console.log('[Zustand Migration] Migrated legacy annotation data:', {
            bookmarks: migrated.bookmarks.length,
            highlights: Object.keys(migrated.highlights).length,
            notes: Object.keys(migrated.notes).length,
        });

        return migrated;
    } catch (e) {
        console.error('[Zustand Migration] Failed:', e);
        return null;
    }
};

let _migrationPromise: Promise<any> | null = migrateLegacyAnnotations();

interface MushafAnnotationState {
    highlights: Record<string, string>;
    highlightTimestamps: Record<string, number>;
    notes: Record<string, string>;
    noteTimestamps: Record<string, number>;
    bookmarks: string[];
    showNotes: boolean;
    showBookmarks: boolean;
    showColorPicker: boolean;
    showNoteModal: boolean;
    noteText: string;
    noteVerseKey: string | null;
    selectedColor: string;

    addHighlight: (verseKey: string, color: string) => void;
    removeHighlight: (verseKey: string) => void;
    addNote: (verseKey: string, note: string, defaultHighlightColor: string) => void;
    deleteNote: (verseKey: string, defaultHighlightColor: string) => void;
    toggleBookmark: (verseKey: string) => void;
    setShowNotes: (v: boolean) => void;
    setShowBookmarks: (v: boolean) => void;
    setShowColorPicker: (v: boolean) => void;
    setShowNoteModal: (v: boolean) => void;
    setNoteText: (v: string) => void;
    setNoteVerseKey: (v: string | null) => void;
    setSelectedColor: (v: string) => void;
}

export const useMushafAnnotationStore = create<MushafAnnotationState>()(
    persist(
        (set, get) => ({
            highlights: {},
            highlightTimestamps: {},
            notes: {},
            noteTimestamps: {},
            bookmarks: [],
            showNotes: false,
            showBookmarks: false,
            showColorPicker: false,
            showNoteModal: false,
            noteText: '',
            noteVerseKey: null,
            selectedColor: 'rgba(255, 235, 59, 0.4)',

            addHighlight: (verseKey, color) => {
                set((state) => ({
                    highlights: { ...state.highlights, [verseKey]: color },
                    highlightTimestamps: { ...state.highlightTimestamps, [verseKey]: Date.now() },
                }));
            },

            removeHighlight: (verseKey) => {
                set((state) => {
                    const newHighlights = { ...state.highlights };
                    const newTimestamps = { ...state.highlightTimestamps };
                    delete newHighlights[verseKey];
                    delete newTimestamps[verseKey];
                    return { highlights: newHighlights, highlightTimestamps: newTimestamps };
                });
            },

            addNote: (verseKey, note, defaultHighlightColor) => {
                const state = get();
                const updates: Partial<MushafAnnotationState> = {
                    notes: { ...state.notes, [verseKey]: note },
                    noteTimestamps: { ...state.noteTimestamps, [verseKey]: Date.now() },
                };
                if (!state.highlights[verseKey]) {
                    updates.highlights = { ...state.highlights, [verseKey]: defaultHighlightColor };
                    updates.highlightTimestamps = { ...state.highlightTimestamps, [verseKey]: Date.now() };
                }
                set(updates);
            },

            deleteNote: (verseKey, defaultHighlightColor) => {
                set((state) => {
                    const newNotes = { ...state.notes };
                    delete newNotes[verseKey];
                    const result: Partial<MushafAnnotationState> = { notes: newNotes };
                    if (state.highlights[verseKey] === defaultHighlightColor) {
                        const newHighlights = { ...state.highlights };
                        const newTimestamps = { ...state.highlightTimestamps };
                        delete newHighlights[verseKey];
                        delete newTimestamps[verseKey];
                        result.highlights = newHighlights;
                        result.highlightTimestamps = newTimestamps;
                    }
                    return result;
                });
            },

            toggleBookmark: (verseKey) => {
                set((state) => ({
                    bookmarks: state.bookmarks.includes(verseKey)
                        ? state.bookmarks.filter(b => b !== verseKey)
                        : [...state.bookmarks, verseKey],
                }));
            },

            setShowNotes: (v) => set({ showNotes: v }),
            setShowBookmarks: (v) => set({ showBookmarks: v }),
            setShowColorPicker: (v) => set({ showColorPicker: v }),
            setShowNoteModal: (v) => set({ showNoteModal: v }),
            setNoteText: (v) => set({ noteText: v }),
            setNoteVerseKey: (v) => set({ noteVerseKey: v }),
            setSelectedColor: (v) => set({ selectedColor: v }),
        }),
        {
            name: 'mushaf-annotations',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                highlights: state.highlights,
                highlightTimestamps: state.highlightTimestamps,
                notes: state.notes,
                noteTimestamps: state.noteTimestamps,
                bookmarks: state.bookmarks,
                selectedColor: state.selectedColor,
            }),
            onRehydrateStorage: () => {
                return async (state, error) => {
                    if (error) {
                        console.error('[Zustand] Rehydration error:', error);
                        return;
                    }
                    if (_migrationPromise) {
                        const migrated = await _migrationPromise;
                        _migrationPromise = null;
                        if (migrated && state) {
                            const store = useMushafAnnotationStore.getState();
                            const isEmpty = store.bookmarks.length === 0 &&
                                Object.keys(store.highlights).length === 0 &&
                                Object.keys(store.notes).length === 0;
                            if (isEmpty) {
                                useMushafAnnotationStore.setState(migrated);
                                console.log('[Zustand] Legacy data applied to store');
                            }
                        }
                    }
                };
            },
        }
    )
);
