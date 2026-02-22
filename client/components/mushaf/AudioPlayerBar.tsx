import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
    SlideInDown,
    SlideOutDown,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useLayoutDimensions } from "@/hooks/useLayoutDimensions";
import { Spacing } from "@/constants/theme";
import { surahs } from "@/data/quran";
import { QuranDataBridge } from "@/services/QuranDataBridge";
import AudioService from "@/services/AudioService";
import { useMushafAudioStore } from "@/stores/useMushafAudioStore";

/**
 * Get the list of verses to play based on the current playUntil setting.
 */
function getVersesToPlay(
    surah: number,
    ayah: number,
    playUntil: "verse" | "surah" | "page" | "juz"
) {
    const quranData = QuranDataBridge.quranData;
    const surahData = quranData.data.surahs.find((s: any) => s.number === surah);
    if (!surahData) return [];

    if (playUntil === "verse") {
        return [{ surah, ayah }];
    } else if (playUntil === "surah") {
        return surahData.ayahs
            .filter((a: any) => a.numberInSurah >= ayah)
            .map((a: any) => ({ surah, ayah: a.numberInSurah }));
    } else if (playUntil === "page") {
        const currentPage = surahData.ayahs.find(
            (a: any) => a.numberInSurah === ayah
        )?.page;
        const allVerses: any[] = [];
        quranData.data.surahs.forEach((s: any) => {
            s.ayahs.forEach((a: any) => {
                if (
                    a.page === currentPage &&
                    (s.number > surah ||
                        (s.number === surah && a.numberInSurah >= ayah))
                ) {
                    allVerses.push({ surah: s.number, ayah: a.numberInSurah });
                }
            });
        });
        return allVerses;
    } else {
        const currentJuz = surahData.ayahs.find(
            (a: any) => a.numberInSurah === ayah
        )?.juz;
        const allVerses: any[] = [];
        quranData.data.surahs.forEach((s: any) => {
            s.ayahs.forEach((a: any) => {
                if (
                    a.juz === currentJuz &&
                    (s.number > surah ||
                        (s.number === surah && a.numberInSurah >= ayah))
                ) {
                    allVerses.push({ surah: s.number, ayah: a.numberInSurah });
                }
            });
        });
        return allVerses;
    }
}

// Re-export for MushafScreen's verse menu play button
export { getVersesToPlay };

/**
 * AudioPlayerBar — extracted from MushafScreen.
 * Renders both the expanded media player bar and the minimized floating player.
 * All state lives in useMushafAudioStore (zero props).
 */
export function AudioPlayerBar() {
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();
    const insets = useSafeAreaInsets();

    // Get tab bar height from context
    const tabBarHeightContext = React.useContext(BottomTabBarHeightContext);
    const tabBarHeight = tabBarHeightContext ?? 0;
    const layout = useLayoutDimensions(tabBarHeight);

    // Responsive scale (base: 375px iPhone width)
    const playerScale = Math.min(1.3, Math.max(0.85, layout.screenWidth / 375));

    // Zustand audio store
    const {
        audioState,
        showSpeedMenu,
        setShowSpeedMenu,
        isPlayerMinimized,
        setIsPlayerMinimized,
        setShowAudioSettings,
    } = useMushafAudioStore();

    // Draggable gesture shared values
    const SCREEN_W = Dimensions.get("window").width;
    const SCREEN_H = Dimensions.get("window").height;
    const playerPositionX = useSharedValue(20);
    const playerPositionY = useSharedValue(0);
    const savedX = useSharedValue(20);
    const savedY = useSharedValue(0);
    const topSafeArea = useSharedValue(insets.top + 60);

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .onStart(() => {
                    savedX.value = playerPositionX.value;
                    savedY.value = playerPositionY.value;
                })
                .onUpdate((e) => {
                    playerPositionX.value = Math.max(
                        10,
                        Math.min(SCREEN_W - 160, savedX.value + e.translationX)
                    );
                    const minY = -SCREEN_H + topSafeArea.value + 100;
                    playerPositionY.value = Math.max(
                        minY,
                        Math.min(0, savedY.value + e.translationY)
                    );
                })
                .onEnd(() => {
                    if (playerPositionX.value < 60) {
                        playerPositionX.value = withTiming(20);
                    } else if (playerPositionX.value > SCREEN_W - 180) {
                        playerPositionX.value = withTiming(SCREEN_W - 160);
                    }
                }),
        []
    );

    const playerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: playerPositionX.value },
            { translateY: playerPositionY.value },
        ],
    }));

    // Nothing to render if no audio is playing
    if (!audioState?.current) return null;

    return (
        <>
            {/* Expanded Media Player Bar */}
            {!isPlayerMinimized && (
                <Animated.View
                    entering={SlideInDown.duration(400).springify()}
                    exiting={SlideOutDown.duration(250)}
                    style={[
                        styles.mediaPlayer,
                        {
                            backgroundColor: isDark
                                ? "rgba(20, 20, 20, 0.88)"
                                : "rgba(255, 255, 255, 0.85)",
                            paddingBottom: Math.max(insets.bottom - 10, 10),
                            borderTopWidth: 1,
                            borderTopColor: isDark
                                ? "rgba(255,255,255,0.08)"
                                : `${theme.primary}33`,
                            borderWidth: 1,
                            borderColor: isDark
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(0,0,0,0.04)",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.12,
                            shadowRadius: 16,
                            elevation: 12,
                        },
                    ]}
                >
                    {/* Drag Handle */}
                    <Pressable
                        onPress={() => setIsPlayerMinimized(!isPlayerMinimized)}
                        style={{
                            paddingVertical: 8 * playerScale,
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        <View
                            style={{
                                width: 36 * playerScale,
                                height: 4 * playerScale,
                                backgroundColor: `${theme.primary}4D`,
                                borderRadius: 2 * playerScale,
                                marginBottom: 4 * playerScale,
                            }}
                        />
                        <ThemedText
                            type="caption"
                            style={{
                                fontSize: 10 * playerScale,
                                opacity: 0.4,
                                letterSpacing: 0.5,
                            }}
                        >
                            {t("mushaf.tapToMinimize")}
                        </ThemedText>
                    </Pressable>

                    {/* Expanded View — Full Controls */}
                    <View style={styles.playerContent}>
                        <View style={styles.playerInfo}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 6 * playerScale,
                                }}
                            >
                                <View
                                    style={{
                                        width: 6 * playerScale,
                                        height: 6 * playerScale,
                                        borderRadius: 3 * playerScale,
                                        backgroundColor: audioState.isPlaying
                                            ? theme.primary
                                            : isDark
                                                ? "#666"
                                                : "#999",
                                        marginRight: 8 * playerScale,
                                    }}
                                />
                                <ThemedText
                                    type="caption"
                                    style={{
                                        opacity: 0.6,
                                        fontSize: 11 * playerScale,
                                        letterSpacing: 0.5,
                                        fontWeight: "600",
                                    }}
                                >
                                    {audioState.isPlaying
                                        ? t("mushaf.nowPlaying")
                                        : t("mushaf.paused")}
                                </ThemedText>
                                <Pressable
                                    onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                                    style={({ pressed }) => [
                                        {
                                            paddingHorizontal: 10 * playerScale,
                                            paddingVertical: 4 * playerScale,
                                            borderRadius: 10 * playerScale,
                                            backgroundColor: `${theme.primary}33`,
                                            transform: [{ scale: pressed ? 0.95 : 1 }],
                                            marginLeft: "auto",
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        type="caption"
                                        style={{
                                            fontSize: 11 * playerScale,
                                            fontWeight: "700",
                                            color: theme.primary,
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        {audioState.playbackRate}x
                                    </ThemedText>
                                </Pressable>
                            </View>
                            <ThemedText
                                type="body"
                                style={{
                                    fontWeight: "700",
                                    fontSize: 16 * playerScale,
                                    letterSpacing: -0.3,
                                    marginBottom: 4 * playerScale,
                                }}
                            >
                                {(locale === "ar"
                                    ? surahs.find(
                                        (s) => s.number === audioState.current.surah
                                    )?.nameAr
                                    : surahs.find(
                                        (s) => s.number === audioState.current.surah
                                    )?.nameEn) ||
                                    `${t("mushaf.surah")} ${audioState.current.surah}`}
                            </ThemedText>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8 * playerScale,
                                    flexWrap: "wrap",
                                }}
                            >
                                <ThemedText
                                    type="caption"
                                    style={{ opacity: 0.5, fontSize: 12 * playerScale }}
                                >
                                    {t("mushaf.verse")} {audioState.current.ayah}
                                </ThemedText>
                                {/* Repeat Progress Indicator */}
                                {audioState.isRepeating && (
                                    <>
                                        <View
                                            style={{
                                                width: 3 * playerScale,
                                                height: 3 * playerScale,
                                                borderRadius: 1.5 * playerScale,
                                                backgroundColor: theme.primary,
                                                opacity: 0.8,
                                            }}
                                        />
                                        <ThemedText
                                            type="caption"
                                            style={{
                                                fontSize: 12 * playerScale,
                                                color: theme.primary,
                                                fontWeight: "600",
                                            }}
                                        >
                                            {t("mushaf.repeat")} {audioState.currentRepeat}/
                                            {audioState.totalRepeats === 0
                                                ? "∞"
                                                : audioState.totalRepeats}
                                        </ThemedText>
                                    </>
                                )}
                                {/* Loop Indicator */}
                                {audioState.isLooping && (
                                    <>
                                        <View
                                            style={{
                                                width: 3 * playerScale,
                                                height: 3 * playerScale,
                                                borderRadius: 1.5 * playerScale,
                                                backgroundColor: isDark ? "#8B5CF6" : "#7C3AED",
                                                opacity: 0.8,
                                            }}
                                        />
                                        <ThemedText
                                            type="caption"
                                            style={{
                                                fontSize: 12 * playerScale,
                                                color: isDark ? "#8B5CF6" : "#7C3AED",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {t("mushaf.loop")}
                                        </ThemedText>
                                    </>
                                )}
                                {audioState.queue.length > 0 && (
                                    <>
                                        <View
                                            style={{
                                                width: 3 * playerScale,
                                                height: 3 * playerScale,
                                                borderRadius: 1.5 * playerScale,
                                                backgroundColor: theme.text,
                                                opacity: 0.3,
                                            }}
                                        />
                                        <ThemedText
                                            type="caption"
                                            style={{ opacity: 0.5, fontSize: 12 * playerScale }}
                                        >
                                            {audioState.queue.length} {t("mushaf.remaining")}
                                        </ThemedText>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Transport Controls */}
                        <View style={styles.playerControls}>
                            <Pressable
                                onPress={() => AudioService.skipToPrevious()}
                                style={({ pressed }) => [
                                    {
                                        width: 40 * playerScale,
                                        height: 40 * playerScale,
                                        borderRadius: 20 * playerScale,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: `${theme.primary}26`,
                                        transform: [{ scale: pressed ? 0.9 : 1 }],
                                    },
                                ]}
                            >
                                <Feather
                                    name="skip-back"
                                    size={18 * playerScale}
                                    color={theme.primary}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    if (audioState.isPlaying) {
                                        AudioService.pause();
                                    } else {
                                        AudioService.resume();
                                    }
                                }}
                                style={({ pressed }) => [
                                    {
                                        width: 52 * playerScale,
                                        height: 52 * playerScale,
                                        borderRadius: 26 * playerScale,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: theme.primary,
                                        transform: [{ scale: pressed ? 0.92 : 1 }],
                                        marginHorizontal: 4 * playerScale,
                                        shadowColor: audioState.isPlaying ? theme.primary : "#000",
                                        shadowOffset: {
                                            width: 0,
                                            height: audioState.isPlaying ? 0 : 4,
                                        },
                                        shadowOpacity: audioState.isPlaying ? 0.7 : 0.3,
                                        shadowRadius: audioState.isPlaying ? 20 : 8,
                                        elevation: audioState.isPlaying ? 16 : 6,
                                    },
                                ]}
                            >
                                <Feather
                                    name={audioState.isPlaying ? "pause" : "play"}
                                    size={20 * playerScale}
                                    color="#FFF"
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => AudioService.skipToNext()}
                                style={({ pressed }) => [
                                    {
                                        width: 40 * playerScale,
                                        height: 40 * playerScale,
                                        borderRadius: 20 * playerScale,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: `${theme.primary}26`,
                                        transform: [{ scale: pressed ? 0.9 : 1 }],
                                    },
                                ]}
                            >
                                <Feather
                                    name="skip-forward"
                                    size={18 * playerScale}
                                    color={theme.primary}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => setShowAudioSettings(true)}
                                style={({ pressed }) => [
                                    {
                                        width: 40 * playerScale,
                                        height: 40 * playerScale,
                                        borderRadius: 20 * playerScale,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: `${theme.primary}26`,
                                        transform: [{ scale: pressed ? 0.9 : 1 }],
                                        marginLeft: 4 * playerScale,
                                    },
                                ]}
                            >
                                <Feather
                                    name="sliders"
                                    size={16 * playerScale}
                                    color={theme.primary}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => AudioService.stop()}
                                style={({ pressed }) => [
                                    {
                                        width: 36 * playerScale,
                                        height: 36 * playerScale,
                                        borderRadius: 18 * playerScale,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: isDark
                                            ? "rgba(255, 255, 255, 0.08)"
                                            : "rgba(0, 0, 0, 0.04)",
                                        opacity: pressed ? 0.6 : 1,
                                        marginLeft: 8 * playerScale,
                                    },
                                ]}
                            >
                                <Feather
                                    name="x"
                                    size={16 * playerScale}
                                    color={theme.text}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Speed Menu */}
                    {showSpeedMenu && (
                        <View
                            style={[
                                styles.speedMenu,
                                {
                                    backgroundColor: isDark
                                        ? "rgba(255, 255, 255, 0.05)"
                                        : "rgba(0, 0, 0, 0.03)",
                                },
                            ]}
                        >
                            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                                <Pressable
                                    key={speed}
                                    onPress={() => {
                                        AudioService.setPlaybackRate(speed);
                                        setShowSpeedMenu(false);
                                    }}
                                    style={({ pressed }) => [
                                        {
                                            paddingVertical: 8,
                                            paddingHorizontal: 16,
                                            opacity: pressed ? 0.6 : 1,
                                            backgroundColor:
                                                audioState.playbackRate === speed
                                                    ? `${theme.primary}26`
                                                    : "transparent",
                                            borderRadius: 8,
                                        },
                                    ]}
                                >
                                    <ThemedText
                                        type="small"
                                        style={{
                                            fontWeight:
                                                audioState.playbackRate === speed ? "600" : "400",
                                            color:
                                                audioState.playbackRate === speed
                                                    ? theme.primary
                                                    : theme.text,
                                        }}
                                    >
                                        {speed}x
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </Animated.View>
            )}

            {/* Minimized Floating Player — Draggable */}
            {isPlayerMinimized && (
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[
                            {
                                position: "absolute",
                                bottom: insets.bottom + 65,
                                left: 0,
                                flexDirection: "row",
                                gap: 8,
                                zIndex: 100,
                            },
                            playerAnimatedStyle,
                        ]}
                    >
                        <Pressable
                            onPress={() => setIsPlayerMinimized(false)}
                            style={({ pressed }) => [
                                {
                                    paddingHorizontal: 14 * playerScale,
                                    paddingVertical: 10 * playerScale,
                                    borderRadius: 20 * playerScale,
                                    backgroundColor: isDark
                                        ? `${theme.primary}FA`
                                        : "rgba(255, 255, 255, 0.98)",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8 * playerScale,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 6,
                                    borderWidth: 1,
                                    borderColor: `${theme.primary}4D`,
                                    transform: [{ scale: pressed ? 0.95 : 1 }],
                                },
                            ]}
                        >
                            <Feather
                                name={audioState.isPlaying ? "pause" : "play"}
                                size={14 * playerScale}
                                color={theme.primary}
                            />
                            <ThemedText
                                type="caption"
                                style={{ fontSize: 12 * playerScale, fontWeight: "600" }}
                            >
                                {(locale === "ar"
                                    ? surahs.find(
                                        (s) => s.number === audioState.current.surah
                                    )?.nameAr
                                    : surahs
                                        .find(
                                            (s) => s.number === audioState.current.surah
                                        )
                                        ?.nameEn?.split(" ")[0]) ||
                                    audioState.current.surah}
                                :{audioState.current.ayah}
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation();
                                if (audioState.isPlaying) {
                                    AudioService.pause();
                                } else {
                                    AudioService.resume();
                                }
                            }}
                            style={({ pressed }) => [
                                {
                                    width: 44 * playerScale,
                                    height: 44 * playerScale,
                                    borderRadius: 22 * playerScale,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: theme.primary,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 6,
                                    transform: [{ scale: pressed ? 0.9 : 1 }],
                                },
                            ]}
                        >
                            <Feather
                                name={audioState.isPlaying ? "pause" : "play"}
                                size={18 * playerScale}
                                color="#FFF"
                            />
                        </Pressable>
                    </Animated.View>
                </GestureDetector>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    mediaPlayer: {
        position: "absolute",
        bottom: 75,
        left: Spacing.md,
        right: Spacing.md,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
        zIndex: 100,
        overflow: "hidden",
    },
    playerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md + 2,
    },
    playerInfo: {
        flex: 1,
    },
    playerControls: {
        flexDirection: "row",
        alignItems: "center",
    },
    speedMenu: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: "rgba(128, 128, 128, 0.1)",
    },
});
