/**
 * QuranDownloadPrompt
 * 
 * Full-screen overlay shown when user opens Mushaf and Quran pages
 * haven't been downloaded yet. Shows a beautiful download prompt
 * with progress bar during download.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { quranImageService, DownloadProgress } from '@/services/QuranImageService';
import { AlertCircle, CloudDownload, Download, WifiOff } from 'lucide-react-native';

interface QuranDownloadPromptProps {
    onDownloadComplete: () => void;
    onDismiss: () => void;
}

export const QuranDownloadPrompt = React.memo(function QuranDownloadPrompt({
    onDownloadComplete,
    onDismiss,
}: QuranDownloadPromptProps) {
    const { isDark, theme } = useTheme();
    const { t } = useTranslation();
    const [progress, setProgress] = useState<DownloadProgress>(quranImageService.getProgress());
    const { isOnline } = useNetworkStatus();

    // Subscribe to download progress
    useEffect(() => {
        const unsubscribe = quranImageService.addProgressListener(setProgress);
        return unsubscribe;
    }, []);

    // Auto-trigger onDownloadComplete when done
    useEffect(() => {
        if (progress.status === 'complete') {
            setTimeout(onDownloadComplete, 500);
        }
    }, [progress.status, onDownloadComplete]);

    const handleDownload = useCallback(async () => {
        try {
            await quranImageService.downloadPages();
        } catch (error) {
            console.error('[QuranDownloadPrompt] Download failed:', error);
        }
    }, []);

    const isDownloading = progress.status === 'downloading';
    const isError = progress.status === 'error';
    const progressPercent = Math.round(progress.progress * 100);

    return (
        <View style={[styles.container, {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
        }]}>
            <View style={styles.content}>
                {/* Icon */}
                <View style={[styles.iconContainer, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                }]}>
                    <CloudDownload size={48} color={theme.primary} />
                </View>

                {/* Title */}
                <ThemedText type="h3" style={styles.title}>
                    {isDownloading ? t('mushaf.downloading') || 'Downloading Mushaf...' : t('mushaf.downloadQuranTitle') || 'Download Quran Pages'}
                </ThemedText>

                {/* Description */}
                <ThemedText type="body" style={[styles.description, { color: theme.textSecondary }]}>
                    {isDownloading
                        ? progress.phase === 'extract'
                            ? t('mushaf.extractingPages') || 'Extracting pages...'
                            : t('mushaf.downloadProgress', {
                                downloaded: (progress.downloadedBytes / 1024 / 1024).toFixed(1),
                                total: (progress.totalBytes / 1024 / 1024).toFixed(1)
                            }) || `${(progress.downloadedBytes / 1024 / 1024).toFixed(1)} MB of ${(progress.totalBytes / 1024 / 1024).toFixed(1)} MB`
                        : t('mushaf.downloadQuranDescription') || 'Download high-resolution Mushaf pages (~65 MB) for offline reading. Pages 1-5 are available immediately.'
                    }
                </ThemedText>

                {/* Progress Bar */}
                {isDownloading && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressTrack, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        }]}>
                            <View style={[styles.progressFill, {
                                backgroundColor: theme.primary,
                                width: `${progressPercent}%`,
                            }]} />
                        </View>
                        <ThemedText type="caption" style={{ marginTop: 8, opacity: 0.6 }}>
                            {progress.phase === 'extract' ? (t('mushaf.extractingPages') || 'Extracting...') : `${progressPercent}%`}
                        </ThemedText>
                    </View>
                )}

                {/* Error */}
                {isError && (
                    <View style={[styles.errorBox, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                        <AlertCircle size={16} color="#FF3B30" />
                        <ThemedText type="caption" style={{ color: '#FF3B30', marginLeft: 8, flex: 1 }}>
                            {progress.error || t('mushaf.downloadFailedNetwork') || 'Download failed. Check your connection and try again.'}
                        </ThemedText>
                    </View>
                )}

                {/* Network warning */}
                {!isDownloading && !isOnline && (
                    <View style={[styles.warningBox, {
                        backgroundColor: isDark ? 'rgba(255,149,0,0.1)' : 'rgba(255,149,0,0.08)',
                    }]}>
                        <WifiOff size={14} color="#FF9500" />
                        <ThemedText type="caption" style={{ color: '#FF9500', marginLeft: 8, flex: 1, fontSize: 12 }}>
                            {t('mushaf.cellularWarning') || "You're not on Wi-Fi. This download will use ~65 MB of cellular data."}
                        </ThemedText>
                    </View>
                )}

                {/* Buttons */}
                {!isDownloading && (
                    <View style={styles.buttonRow}>
                        <Pressable
                            onPress={handleDownload}
                            style={({ pressed }) => [
                                styles.downloadButton,
                                {
                                    backgroundColor: theme.primary,
                                    transform: [{ scale: pressed ? 0.97 : 1 }],
                                    shadowColor: theme.primary,
                                },
                            ]}
                        >
                            <Download size={18} color="#FFFFFF" />
                            <ThemedText type="body" style={styles.downloadButtonText}>
                                {isError ? (t('mushaf.retryDownload') || 'Retry Download') : (t('mushaf.downloadMushaf') || 'Download Mushaf')}
                            </ThemedText>
                        </Pressable>

                        <Pressable
                            onPress={onDismiss}
                            style={({ pressed }) => [
                                styles.laterButton,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    transform: [{ scale: pressed ? 0.97 : 1 }],
                                },
                            ]}
                        >
                            <ThemedText type="body" style={[styles.laterButtonText, { color: theme.textSecondary }]}>
                                {t('mushaf.browseFirstFive') || 'Browse first 5 pages'}
                            </ThemedText>
                        </Pressable>
                    </View>
                )}

                {/* Cancel during download */}
                {isDownloading && (
                    <Pressable
                        onPress={() => {
                            quranImageService.cancelDownload();
                            setProgress(quranImageService.getProgress());
                        }}
                        style={({ pressed }) => [
                            styles.cancelButton,
                            { opacity: pressed ? 0.6 : 1 },
                        ]}
                    >
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                            {t('common.cancel') || 'Cancel'}
                        </ThemedText>
                    </Pressable>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    content: {
        width: '85%',
        maxWidth: 360,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontWeight: '700',
        fontSize: 22,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        width: '100%',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
        width: '100%',
    },
    buttonRow: {
        width: '100%',
        gap: 10,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },
    downloadButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    laterButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 14,
    },
    laterButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
});
