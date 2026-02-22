import React from 'react';
import {
    Modal,
    View,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemedText } from '@/components/ThemedText';
import { useMushafAnnotationStore } from '@/stores/useMushafAnnotationStore';
import { Spacing } from '@/constants/theme';

/**
 * NoteModal — extracted from MushafScreen.
 * Zero-props component: all state lives in useMushafAnnotationStore.
 */
export function NoteModal() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();

    const {
        notes,
        addNote: storeAddNote,
        deleteNote: storeDeleteNote,
        showNoteModal, setShowNoteModal,
        noteText, setNoteText,
        noteVerseKey, setNoteVerseKey,
    } = useMushafAnnotationStore();

    const saveNote = (verseKey: string, note: string) => {
        storeAddNote(verseKey, note, `${theme.primary}26`);
    };

    const deleteNote = (verseKey: string) => {
        storeDeleteNote(verseKey, `${theme.primary}26`);
    };

    if (!showNoteModal || !noteVerseKey) return null;

    return (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowNoteModal(false)}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <Pressable style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} onPress={() => setShowNoteModal(false)}>
                    <Animated.View
                        entering={SlideInUp.duration(200)}
                        style={[
                            styles.noteModal,
                            { backgroundColor: isDark ? `${theme.primary}FA` : 'rgba(245, 245, 245, 0.98)' },
                        ]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <ThemedText type="body" style={{ fontWeight: '600', fontSize: 18 }}>{t('mushaf.addNote')}</ThemedText>
                            <Pressable onPress={() => { setShowNoteModal(false); setNoteVerseKey(null); }}>
                                <Feather name="x" size={20} color={theme.text} />
                            </Pressable>
                        </View>
                        <TextInput
                            value={noteText}
                            onChangeText={setNoteText}
                            placeholder={t('mushaf.noteInputPlaceholder')}
                            placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                            multiline
                            numberOfLines={6}
                            style={[
                                styles.noteInput,
                                {
                                    color: theme.text,
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F8FAFC',
                                    borderWidth: 0,
                                },
                            ]}
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {notes[noteVerseKey] && (
                                <Pressable
                                    onPress={() => {
                                        deleteNote(noteVerseKey);
                                        setShowNoteModal(false);
                                        setNoteVerseKey(null);
                                    }}
                                    style={({ pressed }) => [{
                                        flex: 1,
                                        paddingVertical: 12,
                                        borderRadius: 10,
                                        backgroundColor: isDark ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
                                        opacity: pressed ? 0.7 : 1,
                                    }]}
                                >
                                    <ThemedText type="body" style={{ textAlign: 'center', fontWeight: '600', color: '#FF0000' }}>{t('mushaf.delete')}</ThemedText>
                                </Pressable>
                            )}
                            <Pressable
                                onPress={() => {
                                    if (noteText.trim()) {
                                        saveNote(noteVerseKey, noteText.trim());
                                    }
                                    setShowNoteModal(false);
                                    setNoteVerseKey(null);
                                }}
                                style={({ pressed }) => [{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 10,
                                    backgroundColor: theme.primary,
                                    opacity: pressed ? 0.7 : 1,
                                }]}
                            >
                                <ThemedText type="body" style={{ textAlign: 'center', fontWeight: '600', color: '#FFF' }}>{t('mushaf.save')}</ThemedText>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    noteModal: {
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    noteInput: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 120,
        marginBottom: 16,
        textAlignVertical: 'top',
    },
});
