import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TafsirItem {
    id: string;
    name: string;
    language: string;
    downloaded: boolean;
    url: string | null;
}

interface MushafTafsirState {
    tafsirData: any;
    showArabicTafsir: boolean;
    showTafsirSources: boolean;
    expandedTranslations: boolean;
    expandedTafsirs: boolean;
    expandedAvailable: boolean;
    expandedAvailableTranslations: boolean;
    expandedAvailableTafsirs: boolean;
    translationLanguageFilter: string | null;
    tafsirLanguageFilter: string | null;
    tafsirVerse: any;
    availableTafsirs: TafsirItem[];
    downloadingTafsir: string | null;
    selectedTafsirId: string;
    isSwipingTafsir: boolean;

    setTafsirData: (v: any) => void;
    setShowArabicTafsir: (v: boolean) => void;
    setShowTafsirSources: (v: boolean) => void;
    setExpandedTranslations: (v: boolean) => void;
    setExpandedTafsirs: (v: boolean) => void;
    setExpandedAvailable: (v: boolean) => void;
    setExpandedAvailableTranslations: (v: boolean) => void;
    setExpandedAvailableTafsirs: (v: boolean) => void;
    setTranslationLanguageFilter: (v: string | null) => void;
    setTafsirLanguageFilter: (v: string | null) => void;
    setTafsirVerse: (v: any) => void;
    setAvailableTafsirs: (v: TafsirItem[] | ((prev: TafsirItem[]) => TafsirItem[])) => void;
    setDownloadingTafsir: (v: string | null) => void;
    setSelectedTafsirId: (v: string) => void;
    setIsSwipingTafsir: (v: boolean) => void;
}

export const useMushafTafsirStore = create<MushafTafsirState>()(
    persist(
        (set, get) => ({
            tafsirData: null,
            showArabicTafsir: false,
            showTafsirSources: false,
            expandedTranslations: true,
            expandedTafsirs: true,
            expandedAvailable: true,
            expandedAvailableTranslations: true,
            expandedAvailableTafsirs: true,
            translationLanguageFilter: null,
            tafsirLanguageFilter: null,
            tafsirVerse: null,
            availableTafsirs: [
                { id: 'jalalayn', name: 'Tafsir Jalalayn', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-jalalayn.json' },
                { id: 'abridged', name: 'Abridged Explanation', language: 'en', downloaded: false, url: 'https://sakinahtime.com/tafsirs/abridged-explanation-of-the-quran.json' },
                { id: 'sahih-international', name: 'Sahih International', language: 'en', downloaded: false, url: 'https://sakinahtime.com/translations/en-sahih-international-inline-footnotes.json' },
                { id: 'abdul-hameed-baqavi', name: 'Abdul Hameed Baqavi', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/translations/abdul-hameed-baqavi-simple.json' },
                { id: 'ahl-al-hadith-nepal', name: 'Ahl Al-Hadith Central Society', language: 'ne', downloaded: false, url: 'https://sakinahtime.com/translations/ahl-al-hadith-central-society-of-nepal-simple.json' },
                { id: 'bayanul-furqan-koshur', name: 'Bayanul Furqan (Koshur)', language: 'ks', downloaded: false, url: 'https://sakinahtime.com/translations/bayanul-furqan-koshur-quran-simple.json' },
                { id: 'cs-unknown', name: 'Czech Translation', language: 'cs', downloaded: false, url: 'https://sakinahtime.com/translations/cs-unknown-simple.json' },
                { id: 'dar-al-salam', name: 'Dar Al-Salam Center', language: 'en', downloaded: false, url: 'https://sakinahtime.com/translations/dar-al-salam-center-simple.json' },
                { id: 'de-bubenheim', name: 'Bubenheim & Elyas', language: 'de', downloaded: false, url: 'https://sakinahtime.com/translations/de-bubenheim-simple.json' },
                { id: 'dr-abdullah-abu-bakr', name: 'Dr. Abdullah & Sheikh Nasir', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/dr-abdullah-muhammad-abu-bakr-and-sheikh-nasir-khamis-simple.json' },
                { id: 'dr-abu-bakr-zakaria', name: 'Dr. Abu Bakr Muhammad Zakaria', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/translations/dr-abu-bakr-muhammad-zakaria-simple.json' },
                { id: 'dr-mikhailo-yaqubovic', name: 'Dr. Mikhailo Yaqubovic', language: 'uk', downloaded: false, url: 'https://sakinahtime.com/translations/dr-mikhailo-yaqubovic-simple.json' },
                { id: 'es-isa-garcia', name: 'Isa García', language: 'es', downloaded: false, url: 'https://sakinahtime.com/translations/es-isa-garcia-with-footnote-tags.json' },
                { id: 'fi-unknown', name: 'Finnish Translation', language: 'fi', downloaded: false, url: 'https://sakinahtime.com/translations/fi-unknown-simple.json' },
                { id: 'greek-translation', name: 'Greek Translation', language: 'el', downloaded: false, url: 'https://sakinahtime.com/translations/greek-translation-simple.json' },
                { id: 'hasan-abdul-karim', name: 'Hasan Abdul Karim', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/hasan-abdul-karim-simple.json' },
                { id: 'helmi-nasr', name: 'Helmi Nasr', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/helmi-nasr-simple.json' },
                { id: 'hindi-wbw', name: 'Hindi Word by Word', language: 'hi', downloaded: false, url: 'https://sakinahtime.com/translations/hindi-wbw-translation.json' },
                { id: 'indonesian-wbw', name: 'Indonesian Word by Word', language: 'id', downloaded: false, url: 'https://sakinahtime.com/translations/indonesian-word-by-word-translation.json' },
                { id: 'islamhouse', name: 'IslamHouse.com', language: 'en', downloaded: false, url: 'https://sakinahtime.com/translations/islamhouse-com-simple.json' },
                { id: 'ko-unknown', name: 'Korean Translation', language: 'ko', downloaded: false, url: 'https://sakinahtime.com/translations/ko-unknown-simple.json' },
                { id: 'ml-karakunnu', name: 'Karakunnu', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/translations/ml-karakunnu-simple.json' },
                { id: 'muhammad-makin', name: 'Muhammad Makin', language: 'id', downloaded: false, url: 'https://sakinahtime.com/translations/muhammad-makin-simple.json' },
                { id: 'nl-sofian-siregar', name: 'Sofian S. Siregar', language: 'nl', downloaded: false, url: 'https://sakinahtime.com/translations/nl-sofian-s-siregar-simple.json' },
                { id: 'no-unknown', name: 'Norwegian Translation', language: 'no', downloaded: false, url: 'https://sakinahtime.com/translations/no-unknown-simple.json' },
                { id: 'pashto-sarfaraz', name: 'Sarfaraz Khan', language: 'ps', downloaded: false, url: 'https://sakinahtime.com/translations/pashto-sarfaraz-simple.json' },
                { id: 'pl-jozef-bielawski', name: 'Józef Bielawski', language: 'pl', downloaded: false, url: 'https://sakinahtime.com/translations/pl-jozef-bielawski-simple.json' },
                { id: 'quran-ml-abdul-hameed', name: 'Abdul Hameed (Malayalam)', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/translations/quran-ml-abdul-hameed-simple.json' },
                { id: 'quran-uz-sodik', name: 'Sodik (Uzbek)', language: 'uz', downloaded: false, url: 'https://sakinahtime.com/translations/quran-uz-sodik-simple.json' },
                { id: 'rabila-al-umry', name: 'Rabila Al-Umry', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/rabila-al-umry-simple.json' },
                { id: 'romanian-translation', name: 'Romanian Translation', language: 'ro', downloaded: false, url: 'https://sakinahtime.com/translations/romanian-translation-simple.json' },
                { id: 'ru-nuri', name: 'Nuri (Russian)', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/translations/ru-nuri-simple.json' },
                { id: 'suliman-kanti', name: 'Suliman Kanti', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/translations/suliman-kanti-simple.json' },
                { id: 'sv-knut', name: 'Knut Bernström', language: 'sv', downloaded: false, url: 'https://sakinahtime.com/translations/sv-knut-simple.json' },
                { id: 'tamil-wbw', name: 'Tamil Word by Word', language: 'ta', downloaded: false, url: 'https://sakinahtime.com/translations/tamil-wbw-translation.json' },
                { id: 'translation-pioneers', name: 'Translation Pioneers Center', language: 'en', downloaded: false, url: 'https://sakinahtime.com/translations/translation-pioneers-center-simple.json' },
                { id: 'turkish-wbw', name: 'Turkish Word by Word', language: 'tr', downloaded: false, url: 'https://sakinahtime.com/translations/turkish-wbw-translation.json' },
                { id: 'ur-al-maududi', name: 'Al-Maududi (Urdu)', language: 'ur', downloaded: false, url: 'https://sakinahtime.com/translations/ur-al-maududi-simple.json' },
                { id: 'abu-bakr-jabir-al-jazairi', name: 'Abu Bakr Al-Jazairi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/abu-bakr-jabir-al-jazairi.json' },
                { id: 'al-i-rab-al-muyassar', name: 'Al-Irab Al-Muyassar', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/al-i-rab-al-muyassar.json' },
                { id: 'ar-tafseer-al-saddi', name: 'Tafseer Al-Saddi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ar-tafseer-al-saddi.json' },
                { id: 'ar-tafsir-al-baghawi', name: 'Tafsir Al-Baghawi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ar-tafsir-al-baghawi.json' },
                { id: 'ar-tafsir-al-wasit', name: 'Tafsir Al-Wasit', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ar-tafsir-al-wasit.json' },
                { id: 'arabic-al-mukhtasar', name: 'Al-Mukhtasar', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/arabic-al-mukhtasar-in-interpreting-the-noble-quran.json' },
                { id: 'assamese-mokhtasar', name: 'Mokhtasar', language: 'as', downloaded: false, url: 'https://sakinahtime.com/tafsirs/assamese-mokhtasar.json' },
                { id: 'asseraj-fi-bayan', name: 'Asseraj Fi Bayan', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/asseraj-fi-bayan-gharib-alquran.json' },
                { id: 'bengali-mokhtasar', name: 'Mokhtasar', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/tafsirs/bengali-mokhtasar.json' },
                { id: 'bn-tafseer-ibn-e-kaseer', name: 'Tafseer Ibn Kathir', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/tafsirs/bn-tafseer-ibn-e-kaseer.json' },
                { id: 'bosnian-mokhtasar', name: 'Mokhtasar', language: 'bs', downloaded: false, url: 'https://sakinahtime.com/tafsirs/bosnian-mokhtasar.json' },
                { id: 'chinese-mokhtasar', name: 'Mokhtasar', language: 'zh', downloaded: false, url: 'https://sakinahtime.com/tafsirs/chinese-mokhtasar.json' },
                { id: 'en-tafisr-ibn-kathir', name: 'Tafsir Ibn Kathir', language: 'en', downloaded: false, url: 'https://sakinahtime.com/tafsirs/en-tafisr-ibn-kathir.json' },
                { id: 'french-mokhtasar', name: 'Mokhtasar', language: 'fr', downloaded: false, url: 'https://sakinahtime.com/tafsirs/french-mokhtasar.json' },
                { id: 'i-rab-al-quran', name: 'Irab Al-Quran', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/i-rab-al-quran-li-al-darwish.json' },
                { id: 'id-tafsir-as-saadi', name: 'Tafsir As-Saadi', language: 'id', downloaded: false, url: 'https://sakinahtime.com/tafsirs/id-tafsir-as-saadi.json' },
                { id: 'indonesian-mokhtasar', name: 'Mokhtasar', language: 'id', downloaded: false, url: 'https://sakinahtime.com/tafsirs/indonesian-mokhtasar.json' },
                { id: 'italian-mokhtasar', name: 'Mokhtasar', language: 'it', downloaded: false, url: 'https://sakinahtime.com/tafsirs/italian-mokhtasar.json' },
                { id: 'japanese-mokhtasar', name: 'Mokhtasar', language: 'ja', downloaded: false, url: 'https://sakinahtime.com/tafsirs/japanese-mokhtasar.json' },
                { id: 'khmer-mokhtasar', name: 'Mokhtasar', language: 'km', downloaded: false, url: 'https://sakinahtime.com/tafsirs/khmer-mokhtasar.json' },
                { id: 'malayalam-mokhtasar', name: 'Mokhtasar', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/tafsirs/malayalam-mokhtasar.json' },
                { id: 'persian-mokhtasar', name: 'Mokhtasar', language: 'fa', downloaded: false, url: 'https://sakinahtime.com/tafsirs/persian-mokhtasar.json' },
                { id: 'ru-tafsir-ibne-kahtir', name: 'Tafsir Ibn Kathir', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ru-tafsir-ibne-kahtir.json' },
                { id: 'russian-mokhtasar', name: 'Mokhtasar', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/tafsirs/russian-mokhtasar.json' },
                { id: 'sinhalese-mokhtasar', name: 'Mokhtasar', language: 'si', downloaded: false, url: 'https://sakinahtime.com/tafsirs/sinhalese-mokhtasar.json' },
                { id: 'sq-saadi', name: 'Tafsir As-Saadi', language: 'sq', downloaded: false, url: 'https://sakinahtime.com/tafsirs/sq-saadi.json' },
                { id: 'tafseer-ibn-e-kaseer-urdu', name: 'Tafseer Ibn Kathir', language: 'ur', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafseer-ibn-e-kaseer-urdu.json' },
                { id: 'tafsir-as-saadi-russian', name: 'Tafsir As-Saadi', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-as-saadi-russian.json' },
                { id: 'tafsir-as-saadi', name: 'Tafsir As-Saadi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-as-saadi.json' },
                { id: 'tafsir-bayan-ul-quran', name: 'Bayan-ul-Quran', language: 'ur', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-bayan-ul-quran.json' },
                { id: 'tafsir-ibn-abi-zamanin', name: 'Tafsir Ibn Abi Zamanin', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-ibn-abi-zamanin.json' },
                { id: 'tagalog-mokhtasar', name: 'Mokhtasar', language: 'tl', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tagalog-mokhtasar.json' },
                { id: 'tr-tafsir-ibne-kathir', name: 'Tafsir Ibn Kathir', language: 'tr', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tr-tafsir-ibne-kathir.json' },
                { id: 'turkish-mokhtasar', name: 'Mokhtasar', language: 'tr', downloaded: false, url: 'https://sakinahtime.com/tafsirs/turkish-mokhtasar.json' },
                { id: 'vietnamese-mokhtasar', name: 'Mokhtasar', language: 'vi', downloaded: false, url: 'https://sakinahtime.com/tafsirs/vietnamese-mokhtasar.json' },
            ],
            downloadingTafsir: null,
            selectedTafsirId: 'abridged',
            isSwipingTafsir: false,

            setTafsirData: (v) => set({ tafsirData: v }),
            setShowArabicTafsir: (v) => set({ showArabicTafsir: v }),
            setShowTafsirSources: (v) => set({ showTafsirSources: v }),
            setExpandedTranslations: (v) => set({ expandedTranslations: v }),
            setExpandedTafsirs: (v) => set({ expandedTafsirs: v }),
            setExpandedAvailable: (v) => set({ expandedAvailable: v }),
            setExpandedAvailableTranslations: (v) => set({ expandedAvailableTranslations: v }),
            setExpandedAvailableTafsirs: (v) => set({ expandedAvailableTafsirs: v }),
            setTranslationLanguageFilter: (v) => set({ translationLanguageFilter: v }),
            setTafsirLanguageFilter: (v) => set({ tafsirLanguageFilter: v }),
            setTafsirVerse: (v) => set({ tafsirVerse: v }),
            setAvailableTafsirs: (v) => {
                if (typeof v === 'function') {
                    set((state) => ({ availableTafsirs: v(state.availableTafsirs) }));
                } else {
                    set({ availableTafsirs: v });
                }
            },
            setDownloadingTafsir: (v) => set({ downloadingTafsir: v }),
            setSelectedTafsirId: (v) => set({ selectedTafsirId: v }),
            setIsSwipingTafsir: (v) => set({ isSwipingTafsir: v }),
        }),
        {
            name: 'mushaf-tafsir',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist user preference, not transient UI state
            partialize: (state) => ({
                selectedTafsirId: state.selectedTafsirId,
            }),
        }
    )
);
