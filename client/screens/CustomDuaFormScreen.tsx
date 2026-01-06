/**
 * CustomDuaFormScreen
 * 
 * Form for creating/editing custom duas.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { useCustomDuas } from '@/hooks/useCustomDuas';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type CustomDuaFormRouteProp = RouteProp<RootStackParamList, 'CustomDuaForm'>;

export function CustomDuaFormScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CustomDuaFormRouteProp>();
  const { isDark, theme } = useTheme();

  const { duaId } = route.params || {};
  const isEditing = !!duaId;

  const { customDuas, addCustomDua, updateCustomDua, deleteCustomDua, getCustomDuaById } = useCustomDuas();

  const [textAr, setTextAr] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [translation, setTranslation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing dua if editing
  useEffect(() => {
    if (isEditing && duaId) {
      const existingDua = getCustomDuaById(duaId);
      if (existingDua) {
        setTextAr(existingDua.textAr || '');
        setTransliteration(existingDua.transliteration || '');
        setTranslation(existingDua.translation);
        setNotes(existingDua.notes || '');
      }
    }
  }, [isEditing, duaId, getCustomDuaById]);

  const handleSave = useCallback(async () => {
    // Validate required field
    if (!translation.trim()) {
      Alert.alert('Required Field', 'Please enter the translation/meaning of the dua.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && duaId) {
        await updateCustomDua(duaId, {
          textAr: textAr.trim() || undefined,
          transliteration: transliteration.trim() || undefined,
          translation: translation.trim(),
          notes: notes.trim() || undefined,
        });
      } else {
        await addCustomDua({
          textAr: textAr.trim() || undefined,
          transliteration: transliteration.trim() || undefined,
          translation: translation.trim(),
          notes: notes.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save dua. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isEditing, duaId, textAr, transliteration, translation, notes, addCustomDua, updateCustomDua, navigation]);

  const handleDelete = useCallback(() => {
    if (!duaId) return;

    Alert.alert(
      'Delete Dua',
      'Are you sure you want to delete this dua? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomDua(duaId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete dua. Please try again.');
            }
          },
        },
      ]
    );
  }, [duaId, deleteCustomDua, navigation]);

  const inputStyle = [
    styles.input,
    { 
      backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary,
      color: theme.text,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={{ flex: 1 }}>
          {isEditing ? 'Edit Dua' : 'Add Custom Dua'}
        </ThemedText>
        <Pressable 
          onPress={handleSave} 
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveButton,
            { 
              backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
              opacity: pressed || isSaving ? 0.7 : 1,
            },
          ]}
        >
          <ThemedText type="small" style={{ color: '#fff', fontWeight: '600' }}>
            {isSaving ? 'Saving...' : 'Save'}
          </ThemedText>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Arabic Text */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={styles.label}>
              Arabic Text <ThemedText type="caption" secondary>(Optional)</ThemedText>
            </ThemedText>
            <TextInput
              style={[inputStyle, styles.arabicInput, { fontFamily: 'AlMushafQuran', textAlign: 'right' }]}
              value={textAr}
              onChangeText={setTextAr}
              placeholder="أدخل النص العربي هنا"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Transliteration */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={styles.label}>
              Transliteration <ThemedText type="caption" secondary>(Optional)</ThemedText>
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={transliteration}
              onChangeText={setTransliteration}
              placeholder="Enter transliteration (e.g., Allahumma...)"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Translation - Required */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={styles.label}>
              Translation / Meaning <ThemedText type="caption" style={{ color: '#EF4444' }}>*Required</ThemedText>
            </ThemedText>
            <TextInput
              style={[inputStyle, styles.translationInput]}
              value={translation}
              onChangeText={setTranslation}
              placeholder="Enter the meaning or translation"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Personal Notes */}
          <View style={styles.fieldContainer}>
            <ThemedText type="small" style={styles.label}>
              Personal Notes <ThemedText type="caption" secondary>(Optional)</ThemedText>
            </ThemedText>
            <TextInput
              style={[inputStyle, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any personal notes or reminders"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Delete Button (Edit mode only) */}
          {isEditing && (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                { 
                  backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="trash-2" size={18} color="#EF4444" />
              <ThemedText type="body" style={{ color: '#EF4444', marginLeft: Spacing.sm }}>
                Delete This Dua
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  arabicInput: {
    fontSize: 20,
    lineHeight: 36,
    minHeight: 100,
  },
  translationInput: {
    minHeight: 120,
  },
  notesInput: {
    minHeight: 80,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
});

export default CustomDuaFormScreen;
