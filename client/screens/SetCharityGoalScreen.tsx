/**
 * SetCharityGoalScreen
 * Dedicated screen for setting charity goals
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Keyboard, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useCharityTracker } from '@/hooks/useCharityTracker';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

export default function SetCharityGoalScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const { goal, setGoal } = useCharityTracker();

  const [goalAmount, setGoalAmount] = useState(goal?.amount.toString() || '');

  const accentColor = isDark ? '#34D399' : '#059669';

  const handleSetGoal = async () => {
    Keyboard.dismiss();
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0) return;
    await setGoal({ amount, currency: 'USD' });
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </Pressable>
        <ThemedText type="h2" style={styles.title}>Set Goal</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Card elevation={2} style={styles.card} onPress={Keyboard.dismiss}>
          <ThemedText type="body" style={styles.label}>Goal Amount (USD)</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: isDark ? Colors.dark.text : Colors.light.text,
              }
            ]}
            value={goalAmount}
            onChangeText={setGoalAmount}
            placeholder="1000"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            keyboardType="decimal-pad"
          />
          <Pressable style={[styles.submitButton, { backgroundColor: accentColor }]} onPress={handleSetGoal}>
            <Feather name="target" size={18} color="#fff" />
            <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.sm, fontWeight: '600' }}>Set Goal</ThemedText>
          </Pressable>
        </Card>

        <Card elevation={1} style={styles.infoCard} onPress={Keyboard.dismiss}>
          <Feather name="info" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <ThemedText type="small" secondary style={styles.infoText}>
            Setting a charity goal helps you track your progress throughout Ramadan. You can update this goal at any time.
          </ThemedText>
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
  label: { fontWeight: '600', marginBottom: Spacing.sm },
  input: { padding: Spacing.md, borderRadius: BorderRadius.lg, fontSize: 18, marginBottom: Spacing.lg },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  infoText: { flex: 1 },
});
