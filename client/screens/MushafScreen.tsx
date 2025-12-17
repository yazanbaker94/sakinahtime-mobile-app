import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import Animated, { SlideInUp, SlideOutDown, SlideInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mushafImages } from "@/data/mushaf-images";
import quranData from "@/data/quran-uthmani.json";
import { surahs } from "@/data/quran";
import { surahPages } from "@/data/surah-pages";
import AudioService from "@/services/AudioService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VerseRegion {
  surah: number;
  ayah: number;
  verseKey: string;
  page: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function MushafScreen() {
  const { theme, isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<VerseRegion | null>(null);
  const [tafsirData, setTafsirData] = useState<any>(null);
  const [showArabicTafsir, setShowArabicTafsir] = useState(false);
  const [allCoords, setAllCoords] = useState<any>(null);
  const [showSurahList, setShowSurahList] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [audioState, setAudioState] = useState<any>(null);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    import('../../assets/coordinates/all-pages.json').then(data => setAllCoords(data.default || data));
    loadBookmarks();
    const unsubscribe = AudioService.subscribe(setAudioState);
    return unsubscribe;
  }, []);

  const loadBookmarks = async () => {
    try {
      const saved = await AsyncStorage.getItem('@bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    }
  };

  const toggleBookmark = async (verseKey: string) => {
    const newBookmarks = bookmarks.includes(verseKey)
      ? bookmarks.filter(b => b !== verseKey)
      : [...bookmarks, verseKey];
    setBookmarks(newBookmarks);
    try {
      await AsyncStorage.setItem('@bookmarks', JSON.stringify(newBookmarks));
    } catch (e) {
      console.error('Failed to save bookmark:', e);
    }
  };


  const handleVersePress = useCallback(async (verse: VerseRegion) => {
    setSelectedVerse(verse);
    
    try {
      const enTafsir = await import("@/data/abridged-explanation-of-the-quran.json");
      const arTafsir = await import("@/data/tafsir-jalalayn.json");
      const key = verse.verseKey;
      setTafsirData({
        en: enTafsir[key] || null,
        ar: arTafsir[key] || null,
      });
    } catch (e) {
      console.error("Failed to load tafsir:", e);
      setTafsirData(null);
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedVerse(null);
  }, []);

  const toggleTafsirLanguage = useCallback(async () => {
    const newValue = !showArabicTafsir;
    setShowArabicTafsir(newValue);
    try {
      await AsyncStorage.setItem("@tafsir_language", newValue ? "ar" : "en");
    } catch (e) {
      console.error("Failed to save tafsir preference:", e);
    }
  }, [showArabicTafsir]);

  const getVersesOnPage = (pageNum: number) => {
    const allVerses: any[] = [];
    quranData.data.surahs.forEach((surah: any) => {
      surah.ayahs.forEach((ayah: any) => {
        if (ayah.page === pageNum) {
          allVerses.push({
            surah: surah.number,
            ayah: ayah.numberInSurah,
            verseKey: `${surah.number}:${ayah.numberInSurah}`,
          });
        }
      });
    });
    return allVerses;
  };

  const renderPage = React.useCallback(({ item: pageNum }: { item: number }) => {
    const pageCoords = allCoords?.[pageNum];
    const scale = SCREEN_WIDTH / 1300;
    const imageHeight = 2103 * scale;
    const offsetY = (SCREEN_HEIGHT - imageHeight) / 2;

    const verseGroups = new Map<string, any[]>();
    pageCoords?.forEach((coord: any) => {
      const key = `${coord.sura}:${coord.ayah}`;
      if (!verseGroups.has(key)) verseGroups.set(key, []);
      verseGroups.get(key).push(coord);
    });

    if (audioState?.current) {
      console.log(`🎵 Page ${pageNum} - Audio State:`, {
        current: audioState.current,
        isPlaying: audioState.isPlaying,
        verseKey: `${audioState.current.surah}:${audioState.current.ayah}`
      });
    }

    return (
      <View style={[styles.pageContainer, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
        <Image 
          source={mushafImages[pageNum]} 
          style={[styles.mushafImage, { width: SCREEN_WIDTH, height: imageHeight }]} 
          resizeMode="contain"
        />
        {Array.from(verseGroups.entries()).map(([verseKey, coords]) => {
          const [surah, ayah] = verseKey.split(':');
          const lineGroups = new Map<number, any[]>();
          coords.forEach(c => {
            if (!lineGroups.has(c.line)) lineGroups.set(c.line, []);
            lineGroups.get(c.line).push(c);
          });
          
          return Array.from(lineGroups.values()).map((lineCoords, idx) => {
            const minX = Math.min(...lineCoords.map(c => c.x));
            const minY = Math.min(...lineCoords.map(c => c.y));
            const maxX = Math.max(...lineCoords.map(c => c.x + c.width));
            const maxY = Math.max(...lineCoords.map(c => c.y + c.height));
            
            const isAudioPlaying = audioState?.current && `${audioState.current.surah}:${audioState.current.ayah}` === verseKey;
            const isSelected = selectedVerse?.verseKey === verseKey;
            
            if (isAudioPlaying) {
              console.log('✅ Highlighting verse:', verseKey, 'on page', pageNum);
            }
            
            return (
              <Pressable
                key={`${verseKey}-${idx}`}
                style={[styles.verseRegion, { 
                  left: minX * scale, 
                  top: (minY * scale) + offsetY, 
                  width: (maxX - minX) * scale, 
                  height: (maxY - minY) * scale, 
                  backgroundColor: isAudioPlaying 
                    ? 'rgba(52, 211, 153, 0.3)' 
                    : isSelected 
                    ? 'rgba(76, 175, 80, 0.2)' 
                    : 'transparent'
                }]}
                onPress={() => handleVersePress({ surah: parseInt(surah), ayah: parseInt(ayah), verseKey })}
              />
            );
          });
        })}
      </View>
    );
  }, [allCoords, selectedVerse, handleVersePress, audioState, SCREEN_WIDTH, SCREEN_HEIGHT]);

  const goToSurah = (surahNumber: number) => {
    const page = surahPages[surahNumber];
    console.log('goToSurah called:', { surahNumber, page });
    if (page) {
      const index = 604 - page;
      const offset = index * SCREEN_WIDTH;
      console.log('Scrolling to:', { index, offset });
      setShowSurahList(false);
      setIsNavigating(true);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset, animated: false });
        setTimeout(() => setIsNavigating(false), 300);
      });
    } else {
      console.log('No page found for surah:', surahNumber);
    }
  };

  const renderSurahItem = React.useCallback(({ item }: { item: any }) => (
    <Pressable
      onPress={() => goToSurah(item.number)}
      style={({ pressed }) => [
        styles.surahItem,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
          transform: [{ scale: pressed ? 0.98 : 1 }, { translateY: pressed ? 1 : 0 }],
        },
      ]}
    >
      <View style={styles.surahItemContent}>
        <View style={styles.surahLeft}>
          <View style={[styles.surahNumber, { 
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
          }]}>
            <ThemedText type="small" style={{ color: isDark ? '#34D399' : '#059669', fontWeight: '700', fontSize: 13 }}>{item.number}</ThemedText>
          </View>
          <View style={styles.surahInfo}>
            <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.3 }}>{item.nameEn}</ThemedText>
            <View style={styles.versesBadge}>
              <View style={[styles.verseDot, { backgroundColor: isDark ? '#34D399' : '#059669' }]} />
              <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>{item.versesCount} verses</ThemedText>
            </View>
          </View>
        </View>
        <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 20, opacity: 0.85, letterSpacing: 1 }}>{item.nameAr}</ThemedText>
      </View>
    </Pressable>
  ), [isDark, goToSurah]);

  if (showBookmarks) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.surahListHeader, { 
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 28 }}>Bookmarks</ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>{bookmarks.length} verses</ThemedText>
              </View>
              <Pressable 
                onPress={() => {
                  setShowBookmarks(false);
                  requestAnimationFrame(() => {
                    const index = 604 - currentPage;
                    flatListRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: false });
                  });
                }}
                style={({ pressed }) => [{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  opacity: pressed ? 0.6 : 1,
                }]}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>
        {bookmarks.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
            <Feather name="bookmark" size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: Spacing.md }} />
            <ThemedText type="body" style={{ opacity: 0.5, textAlign: 'center' }}>No bookmarks yet</ThemedText>
            <ThemedText type="caption" style={{ opacity: 0.4, textAlign: 'center', marginTop: Spacing.xs }}>Tap any verse to bookmark it</ThemedText>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const [surah, ayah] = item.split(':');
              const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
              const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
              const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
              const verseText = ayahData?.text || '';
              const preview = verseText.length > 60 ? verseText.substring(0, 60) + '...' : verseText;
              
              return (
                <Pressable
                  onPress={() => {
                    console.log('Bookmark clicked:', { item, surah, ayah });
                    const page = ayahData?.page || 1;
                    console.log('Page number:', page);
                    const index = 604 - page;
                    const offset = index * SCREEN_WIDTH;
                    console.log('Scroll to:', { index, offset, SCREEN_WIDTH });
                    setShowBookmarks(false);
                    setIsNavigating(true);
                    requestAnimationFrame(() => {
                      flatListRef.current?.scrollToOffset({ offset, animated: false });
                      setTimeout(() => setIsNavigating(false), 300);
                    });
                  }}
                  style={({ pressed }) => [
                    styles.surahItem,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.surahItemContent}>
                    <View style={styles.surahLeft}>
                      <View style={[styles.surahNumber, { 
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                      }]}>
                        <Feather name="bookmark" size={18} color={isDark ? '#34D399' : '#059669'} fill={isDark ? '#34D399' : '#059669'} />
                      </View>
                      <View style={styles.surahInfo}>
                        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16 }}>{surahInfo?.nameEn || `Surah ${surah}`}, Verse {ayah}</ThemedText>
                        <ThemedText type="caption" style={{ marginTop: 4, opacity: 0.7, lineHeight: 18 }} numberOfLines={2}>{preview}</ThemedText>
                      </View>
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleBookmark(item);
                      }}
                      style={({ pressed }) => [{
                        padding: 8,
                        opacity: pressed ? 0.5 : 1,
                      }]}
                    >
                      <Feather name="trash-2" size={18} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            }}
            contentContainerStyle={{ padding: Spacing.lg }}
          />
        )}
      </ThemedView>
    );
  }

  if (showSurahList) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.surahListHeader, { 
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 28 }}>Quran</ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>114 Surahs</ThemedText>
              </View>
              <Pressable 
                onPress={() => {
                  setShowSurahList(false);
                  requestAnimationFrame(() => {
                    const index = 604 - currentPage;
                    flatListRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: false });
                  });
                }}
                style={({ pressed }) => [{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  opacity: pressed ? 0.6 : 1,
                }]}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>
        <FlatList
          data={surahs}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderSurahItem}
          getItemLayout={(_, index) => ({
            length: 68,
            offset: 68 * index,
            index,
          })}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          contentContainerStyle={{ padding: Spacing.lg }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.floatingButtons}>
        <Pressable
          onPress={() => setShowBookmarks(true)}
          style={({ pressed }) => [
            styles.floatingButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.85 : 1,
              marginRight: 12,
            },
          ]}
        >
          <View style={styles.buttonGlow} />
          <Feather name="bookmark" size={22} color={isDark ? '#FFF' : '#1A1A1A'} />
          {bookmarks.length > 0 && (
            <View style={[styles.badge, { backgroundColor: isDark ? '#34D399' : '#059669' }]}>
              <ThemedText type="small" style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>{bookmarks.length}</ThemedText>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={() => setShowSurahList(true)}
          style={({ pressed }) => [
            styles.floatingButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              transform: [{ scale: pressed ? 0.92 : 1 }],
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.buttonGlow} />
          <Feather name="book-open" size={22} color={isDark ? '#FFF' : '#1A1A1A'} />
        </Pressable>
      </View>
      <FlatList
        ref={flatListRef}
        data={Array.from({ length: 604 }, (_, i) => 604 - i)}
        renderItem={renderPage}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const offset = e.nativeEvent.contentOffset.x;
          const index = Math.round(offset / SCREEN_WIDTH);
          const page = 604 - index;
          console.log('Scroll ended:', { offset, index, calculatedPage: page });
          setCurrentPage(page);
        }}
        onScrollToIndexFailed={(info) => {
          console.log('Scroll to index failed:', info);
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={11}
        removeClippedSubviews={true}
      />

      {/* Tafsir Modal */}
      <Modal
        visible={selectedVerse !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          {selectedVerse ? (
            <Animated.View
              entering={SlideInUp.duration(200)}
              exiting={SlideOutDown.duration(150)}
              style={[
                styles.modalContainer,
                {
                  backgroundColor: isDark
                    ? Colors.dark.backgroundSecondary
                    : Colors.light.backgroundDefault,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  Surah {selectedVerse.surah}, Verse {selectedVerse.ayah}
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable 
                    onPress={() => {
                      if (audioState?.isPlaying && audioState?.current?.surah === selectedVerse.surah && audioState?.current?.ayah === selectedVerse.ayah) {
                        AudioService.pause();
                      } else {
                        setShowPlayMenu(!showPlayMenu);
                      }
                    }}
                    style={({ pressed }) => [{
                      opacity: pressed ? 0.6 : 1,
                    }]}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={theme.textSecondary} />
                    ) : (
                      <Feather 
                        name={audioState?.isPlaying && audioState?.current?.surah === selectedVerse.surah && audioState?.current?.ayah === selectedVerse.ayah ? "pause" : "play"} 
                        size={20} 
                        color={isDark ? '#34D399' : '#059669'}
                      />
                    )}
                  </Pressable>
                  <Pressable 
                    onPress={() => toggleBookmark(selectedVerse.verseKey)}
                    style={({ pressed }) => [{
                      opacity: pressed ? 0.6 : 1,
                    }]}
                  >
                    <Feather 
                      name={bookmarks.includes(selectedVerse.verseKey) ? "bookmark" : "bookmark"} 
                      size={20} 
                      color={bookmarks.includes(selectedVerse.verseKey) ? (isDark ? '#34D399' : '#059669') : theme.textSecondary}
                      fill={bookmarks.includes(selectedVerse.verseKey) ? (isDark ? '#34D399' : '#059669') : 'none'}
                    />
                  </Pressable>
                  <Pressable onPress={closeModal}>
                    <Feather name="x" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {showPlayMenu && (
                <View style={[styles.playMenu, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                  <Pressable
                    onPress={async () => {
                      setShowPlayMenu(false);
                      closeModal();
                      await AudioService.play(selectedVerse.surah, selectedVerse.ayah, 'single');
                    }}
                    style={({ pressed }) => [styles.playMenuItem, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Feather name="play" size={16} color={theme.text} />
                    <ThemedText type="small" style={{ marginLeft: 8 }}>Play this verse</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      setShowPlayMenu(false);
                      closeModal();
                      const surahData = surahs.find(s => s.number === selectedVerse.surah);
                      await AudioService.play(selectedVerse.surah, selectedVerse.ayah, 'fromVerse', surahData?.versesCount);
                    }}
                    style={({ pressed }) => [styles.playMenuItem, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Feather name="skip-forward" size={16} color={theme.text} />
                    <ThemedText type="small" style={{ marginLeft: 8 }}>Play from here</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      setShowPlayMenu(false);
                      closeModal();
                      const surahData = surahs.find(s => s.number === selectedVerse.surah);
                      await AudioService.play(selectedVerse.surah, 1, 'fullSurah', surahData?.versesCount);
                    }}
                    style={({ pressed }) => [styles.playMenuItem, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Feather name="list" size={16} color={theme.text} />
                    <ThemedText type="small" style={{ marginLeft: 8 }}>Play full surah</ThemedText>
                  </Pressable>
                </View>
              )}

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
                {(tafsirData?.en?.text || tafsirData?.ar?.text) && (
                  <>
                    <View style={styles.tafsirHeader}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        Tafsir {showArabicTafsir ? "(Jalalayn)" : ""}
                      </ThemedText>
                      <Pressable
                        onPress={toggleTafsirLanguage}
                        style={[
                          styles.tafsirToggle,
                          {
                            backgroundColor: isDark
                              ? Colors.dark.primary
                              : Colors.light.primary,
                          },
                        ]}
                      >
                        <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                          {showArabicTafsir ? "EN" : "عربي"}
                        </ThemedText>
                      </Pressable>
                    </View>
                    <ThemedText
                      type={showArabicTafsir ? "arabic" : "small"}
                      secondary={!showArabicTafsir}
                      style={[
                        styles.tafsirText,
                        showArabicTafsir && { textAlign: "right", fontFamily: "AlMushafQuran" },
                      ]}
                    >
                      {showArabicTafsir
                        ? tafsirData?.ar?.text?.replace(/<[^>]*>/g, "").trim() ||
                          "No Arabic tafsir available"
                        : tafsirData?.en?.text?.replace(/<[^>]*>/g, "").trim() ||
                          "No English tafsir available"}
                    </ThemedText>
                  </>
                )}
              </ScrollView>
            </Animated.View>
          ) : null}
        </View>
      </Modal>

      {/* Media Player Bar */}
      {audioState?.current && (
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.mediaPlayer,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          <View style={styles.playerContent}>
            <View style={styles.playerInfo}>
              <ThemedText type="body" style={{ fontWeight: '600', fontSize: 14 }}>
                {surahs.find(s => s.number === audioState.current.surah)?.nameEn || `Surah ${audioState.current.surah}`}, Verse {audioState.current.ayah}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <ThemedText type="caption" style={{ opacity: 0.6, fontSize: 12 }}>
                  {audioState.queue.length > 0 ? `${audioState.queue.length} remaining` : audioState.isPlaying ? 'Playing' : 'Paused'}
                </ThemedText>
                <Pressable
                  onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                  style={({ pressed }) => [{
                    marginLeft: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)',
                    opacity: pressed ? 0.6 : 1,
                  }]}
                >
                  <ThemedText type="caption" style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#34D399' : '#059669' }}>
                    {audioState.playbackRate}x
                  </ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={styles.playerControls}>
              <Pressable
                onPress={() => AudioService.skipToPrevious()}
                style={({ pressed }) => [{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  opacity: pressed ? 0.6 : 1,
                }]}
              >
                <Feather name="skip-back" size={16} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (audioState.isPlaying) {
                    AudioService.pause();
                  } else if (audioState.current) {
                    AudioService.play(audioState.current.surah, audioState.current.ayah, 'single');
                  }
                }}
                style={({ pressed }) => [{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#34D399' : '#059669',
                  opacity: pressed ? 0.8 : 1,
                  marginHorizontal: 8,
                }]}
              >
                <Feather name={audioState.isPlaying ? 'pause' : 'play'} size={20} color="#FFF" />
              </Pressable>
              <Pressable
                onPress={() => AudioService.skipToNext()}
                style={({ pressed }) => [{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  opacity: pressed ? 0.6 : 1,
                }]}
              >
                <Feather name="skip-forward" size={16} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => AudioService.stop()}
                style={({ pressed }) => [{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  opacity: pressed ? 0.6 : 1,
                  marginLeft: 8,
                }]}
              >
                <Feather name="x" size={16} color={theme.text} />
              </Pressable>
            </View>
          </View>
          {showSpeedMenu && (
            <View style={[styles.speedMenu, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                <Pressable
                  key={speed}
                  onPress={() => {
                    AudioService.setPlaybackRate(speed);
                    setShowSpeedMenu(false);
                  }}
                  style={({ pressed }) => [{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    opacity: pressed ? 0.6 : 1,
                    backgroundColor: audioState.playbackRate === speed ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)') : 'transparent',
                    borderRadius: 8,
                  }]}
                >
                  <ThemedText type="small" style={{ fontWeight: audioState.playbackRate === speed ? '600' : '400', color: audioState.playbackRate === speed ? (isDark ? '#34D399' : '#059669') : theme.text }}>
                    {speed}x
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    backgroundColor: "#F5F5F5",
    justifyContent: 'center',
    alignItems: 'center',
  },
  mushafImage: {
    position: 'absolute',
  },
  verseRegion: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  floatingButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    zIndex: 10,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 28,
  },
  surahListHeader: {
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  surahItem: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  surahItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md + 4,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  surahInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  versesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verseDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  surahNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    borderRadius: BorderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  modalContent: {
    padding: Spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  tafsirHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  tafsirToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tafsirText: {
    lineHeight: 24,
  },
  playMenu: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  playMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  mediaPlayer: {
    position: 'absolute',
    bottom: 75,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 100,
    overflow: 'hidden',
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
});
