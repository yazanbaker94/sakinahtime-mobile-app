import { create } from 'zustand';

interface MushafSearchState {
    showSearchBar: boolean;
    searchQuery: string;
    searchResults: any[];
    isSearching: boolean;
    includeTafsirInSearch: boolean;
    highlightedVerse: string | null;
    lastSearchTerm: string;

    setShowSearchBar: (v: boolean) => void;
    setSearchQuery: (v: string) => void;
    setSearchResults: (v: any[]) => void;
    setIsSearching: (v: boolean) => void;
    setIncludeTafsirInSearch: (v: boolean) => void;
    setHighlightedVerse: (v: string | null) => void;
    setLastSearchTerm: (v: string) => void;
    clearSearch: () => void;
}

export const useMushafSearchStore = create<MushafSearchState>()((set) => ({
    showSearchBar: false,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    includeTafsirInSearch: false,
    highlightedVerse: null,
    lastSearchTerm: '',

    setShowSearchBar: (v) => set({ showSearchBar: v }),
    setSearchQuery: (v) => set({ searchQuery: v }),
    setSearchResults: (v) => set({ searchResults: v }),
    setIsSearching: (v) => set({ isSearching: v }),
    setIncludeTafsirInSearch: (v) => set({ includeTafsirInSearch: v }),
    setHighlightedVerse: (v) => set({ highlightedVerse: v }),
    setLastSearchTerm: (v) => set({ lastSearchTerm: v }),
    clearSearch: () =>
        set({ searchQuery: '', searchResults: [], isSearching: false, lastSearchTerm: '' }),
}));
