/**
 * LogTaraweehScreen
 * Dedicated screen for logging Taraweeh prayers
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useTaraweehTracker } from '@/hooks/useTaraweehTracker';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type LogTaraweehRouteProp = RouteProp<RootStackParamList, 'LogTaraweeh'>;

export default function LogTaraweehScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<LogTaraweehRouteProp>();
  const { entries, logTaraweeh, deleteEntry } = useTaraweehTracker();

  const { day, existingEntry } = route.params || {};
  const entriesByDay = new Map(entries.map(e => [e.hijriDay, e]));
  const entry = existingEntry || (day ? entriesByDay.get(day) : undefined);

  const [rakaat, setRakaat] = useState<8 | 20>(entry?.rakaat || 8);
  const [location, setLocation] = useState<'mosque' | 'home'>(entry?.location || 'mosque');
  const [notes, setNotes] = useState(entry?.notes || '');

  const accentColor = isDark ? '#A78BFA' : '#7C3AED';

  useEffect(() => {
    if (entry) {
      setRakaat(entry.rakaat);
      setLocation(entry.location);
      setNotes(entry.notes || '');
    }
  }, [entry]);

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!day) return;
    await logTaraweeh({ date: new Date(), hijriDay: day, rakaat, location, notes: notes.trim() || undefined });
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (entry) await deleteEntry(entry.id);
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </Pressable>
        <ThemedText type="h2" style={styles.title}>{entry ? 'Edit' : 'Log'} Night {day}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Card elevation={2} style={styles.card} onPress={Keyboard.dismiss}>
          <ThemedText type="body" style={styles.label}>Rakaat</ThemedText>
          <View style={styles.selectionButtons}>
            <Pressable style={[styles.selectionButton, rakaat === 8 && { backgroundColor: accentColor }]} onPress={() => setRakaat(8)}>
              <ThemedText type="body" style={{ color: rakaat === 8 ? '#fff' : undefined }}>8 Rakaat</ThemedText>
            </Pressable>
            <Pressable style={[styles.selectionButton, rakaat === 20 && { backgroundColor: accentColor }]} onPress={() => setRakaat(20)}>
              <ThemedText type="body" style={{ color: rakaat === 20 ? '#fff' : undefined }}>20 Rakaat</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="body" style={styles.label}>Location</ThemedText>
          <View style={styles.selectionButtons}>
            <Pressable style={[styles.selectionButton, location === 'mosque' && { backgroundColor: '#10B981' }]} onPress={() => setLocation('mosque')}>
              <Feather name="map-pin" size={16} color={location === 'mosque' ? '#fff' : undefined} />
              <ThemedText type="body" style={{ marginLeft: Spacing.xs, color: location === 'mosque' ? '#fff' : undefined }}>Mosque</ThemedText>
            </Pressable>
            <Pressable style={[styles.selectionButton, location === 'home' && { backgroundColor: accentColor }]} onPress={() => setLocation('home')}>
              <Feather name="home" size={16} color={location === 'home' ? '#fff' : undefined} />
              <ThemedText type="body" style={{ marginLeft: Spacing.xs, color: location === 'home' ? '#fff' : undefined }}>Home</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="body" style={styles.label}>Notes (optional)</ThemedText>
          <TextInput
            style={[styles.notesInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? Colors.dark.text : Colors.light.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            multiline
            blurOnSubmit={true}
            returnKeyType="done"
          />

          <View style={styles.actions}>
            {entry && (
              <Pressable style={[styles.deleteButton, { borderColor: '#EF4444' }]} onPress={handleDelete}>
                <Feather name="trash-2" size={16} color="#EF4444" />
                <ThemedText type="body" style={{ color: '#EF4444', marginLeft: Spacing.xs }}>Delete</ThemedText>
              </Pressable>
            )}
            <Pressable style={[styles.saveButton, { backgroundColor: accentColor }]} onPress={handleSave}>
              <Feather name="check" size={16} color="#fff" />
              <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.xs }}>Save</ThemedText>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  backButton: { padding: Spacing.xs },
  title: { fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  card: { marginBottom: Spacing.lg },
  label: { fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md },
  selectionButtons: { flexDirection: 'row', gap: Spacing.sm },
  selectionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(128, 128, 128, 0.2)' },
  notesInput: { padding: Spacing.md, borderRadius: BorderRadius.lg, minHeight: 80, textAlignVertical: 'top', fontSize: 16 },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  saveButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
});
