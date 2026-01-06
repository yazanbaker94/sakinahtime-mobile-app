/**
 * AddDonationScreen
 * Dedicated screen for adding charity donations
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useCharityTracker } from '@/hooks/useCharityTracker';
import { CharityType } from '@/types/ramadan';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

const CHARITY_TYPES: { value: CharityType; label: string; icon: string }[] = [
  { value: 'sadaqah', label: 'Sadaqah', icon: 'heart' },
  { value: 'zakat', label: 'Zakat', icon: 'percent' },
  { value: 'fidya', label: 'Fidya', icon: 'coffee' },
  { value: 'kaffarah', label: 'Kaffarah', icon: 'shield' },
  { value: 'other', label: 'Other', icon: 'gift' },
];

export default function AddDonationScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const { addEntry } = useCharityTracker();

  const [entryType, setEntryType] = useState<CharityType>('sadaqah');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryRecipient, setEntryRecipient] = useState('');
  const [entryNotes, setEntryNotes] = useState('');

  const accentColor = isDark ? '#34D399' : '#059669';

  const handleAddEntry = async () => {
    Keyboard.dismiss();
    const amount = parseFloat(entryAmount);
    if (isNaN(amount) || amount <= 0) return;
    await addEntry({
      date: new Date(),
      type: entryType,
      amount,
      currency: 'USD',
      recipient: entryRecipient.trim() || undefined,
      notes: entryNotes.trim() || undefined,
      isAnonymous: false,
    });
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </Pressable>
        <ThemedText type="h2" style={styles.title}>Add Donation</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Card elevation={2} style={styles.card} onPress={Keyboard.dismiss}>
          <ThemedText type="body" style={styles.label}>Type</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            <View style={styles.typeButtons}>
              {CHARITY_TYPES.map(({ value, label, icon }) => (
                <Pressable
                  key={value}
                  style={[styles.typeButton, entryType === value && { backgroundColor: accentColor }]}
                  onPress={() => setEntryType(value)}
                >
                  <Feather name={icon as any} size={16} color={entryType === value ? '#fff' : accentColor} />
                  <ThemedText type="small" style={{ marginLeft: 4, color: entryType === value ? '#fff' : undefined }}>{label}</ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <ThemedText type="body" style={styles.label}>Amount</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? Colors.dark.text : Colors.light.text }]}
            value={entryAmount}
            onChangeText={setEntryAmount}
            placeholder="0.00"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            keyboardType="decimal-pad"
          />

          <ThemedText type="body" style={styles.label}>Recipient (optional)</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? Colors.dark.text : Colors.light.text }]}
            value={entryRecipient}
            onChangeText={setEntryRecipient}
            placeholder="Organization or person"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          />

          <ThemedText type="body" style={styles.label}>Notes (optional)</ThemedText>
          <TextInput
            style={[styles.input, styles.notesInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? Colors.dark.text : Colors.light.text }]}
            value={entryNotes}
            onChangeText={setEntryNotes}
            placeholder="Add any notes..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            multiline
            blurOnSubmit={true}
            returnKeyType="done"
          />

          <Pressable style={[styles.submitButton, { backgroundColor: accentColor }]} onPress={handleAddEntry}>
            <Feather name="check" size={18} color="#fff" />
            <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.sm, fontWeight: '600' }}>Add Donation</ThemedText>
          </Pressable>
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
  typeScroll: { marginBottom: Spacing.sm },
  typeButtons: { flexDirection: 'row', gap: Spacing.sm },
  typeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: 'rgba(128, 128, 128, 0.2)' },
  input: { padding: Spacing.md, borderRadius: BorderRadius.lg, fontSize: 16, marginBottom: Spacing.sm },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.lg },
});
