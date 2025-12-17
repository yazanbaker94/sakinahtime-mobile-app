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
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import Animated, { SlideInUp, SlideOutDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mushafImages } from "@/data/mushaf-images";
import quranData from "@/data/quran-uthmani.json";

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

  React.useEffect(() => {
    import('../../assets/coordinates/all-pages.json').then(data => setAllCoords(data.default || data));
  }, []);


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

  const renderPage = (pageNum: number) => {
    const pageCoords = allCoords?.[pageNum];
    const scale = SCREEN_WIDTH / 1300;

    const verseGroups = new Map<string, any[]>();
    pageCoords?.forEach((coord: any) => {
      const key = `${coord.sura}:${coord.ayah}`;
      if (!verseGroups.has(key)) verseGroups.set(key, []);
      verseGroups.get(key).push(coord);
    });

    return (
      <View style={styles.pageContainer}>
        <Image source={mushafImages[pageNum]} style={[styles.mushafImage, { width: SCREEN_WIDTH, height: 2103 * scale }]} />
        {Array.from(verseGroups.entries()).map(([verseKey, coords]) => {
          const [surah, ayah] = verseKey.split(':');
          return coords.map((coord: any, idx: number) => (
            <Pressable
              key={`${verseKey}-${idx}`}
              style={[styles.verseRegion, { 
                left: coord.x * scale, 
                top: coord.y * scale, 
                width: coord.width * scale, 
                height: coord.height * scale, 
                backgroundColor: selectedVerse?.verseKey === verseKey ? 'rgba(76, 175, 80, 0.3)' : 'transparent'
              }]}
              onPress={() => handleVersePress({ surah: parseInt(surah), ayah: parseInt(ayah), verseKey })}
            />
          ));
        })}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={Array.from({ length: 604 }, (_, i) => i + 1)}
        renderItem={({ item }) => renderPage(item)}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        inverted
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH) + 1;
          setCurrentPage(page);
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
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
                <Pressable onPress={closeModal}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#FFFFFF",
    overflow: 'hidden',
  },
  mushafImage: {
    width: 1300,
    height: 2103,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  verseRegion: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    // Uncomment to see regions:
    // backgroundColor: "rgba(255, 0, 0, 0.1)",
    // borderWidth: 1,
    // borderColor: "red",
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
});
