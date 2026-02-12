/**
 * ZakatCalculatorScreen
 * Dedicated screen for Zakat calculation
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Keyboard, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useCharityTracker } from '@/hooks/useCharityTracker';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ZakatCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { calculateZakat } = useCharityTracker();

  const [wealth, setWealth] = useState('');
  const [result, setResult] = useState<ReturnType<typeof calculateZakat> | null>(null);

  const accentColor = theme.primary;

  const handleCalculate = () => {
    Keyboard.dismiss();
    const wealthAmount = parseFloat(wealth);
    if (isNaN(wealthAmount) || wealthAmount < 0) return;
    setResult(calculateZakat(wealthAmount));
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h2" style={styles.title}>{t('zakatCalculator.title')}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Card elevation={2} style={styles.card} onPress={Keyboard.dismiss}>
          <ThemedText type="body" style={styles.label}>{t('zakatCalculator.totalWealth')}</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: theme.text,
              }
            ]}
            value={wealth}
            onChangeText={setWealth}
            placeholder={t('zakatCalculator.enterWealth')}
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            keyboardType="decimal-pad"
          />

          <Pressable
            style={[styles.calculateButton, { backgroundColor: accentColor }]}
            onPress={handleCalculate}
          >
            <Feather name="percent" size={18} color="#fff" />
            <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.sm, fontWeight: '600' }}>
              {t('zakatCalculator.calculate')}
            </ThemedText>
          </Pressable>
        </Card>

        {result && (
          <Card elevation={2} style={styles.resultCard} onPress={Keyboard.dismiss}>
            <ThemedText type="h4" style={styles.resultTitle}>{t('zakatCalculator.results')}</ThemedText>
            <View style={styles.resultRow}>
              <ThemedText type="body" secondary>{t('zakatCalculator.nisabGold')}:</ThemedText>
              <ThemedText type="body">{formatCurrency(result.nisabGold)}</ThemedText>
            </View>
            <View style={styles.resultRow}>
              <ThemedText type="body" secondary>{t('zakatCalculator.nisabSilver')}:</ThemedText>
              <ThemedText type="body">{formatCurrency(result.nisabSilver)}</ThemedText>
            </View>
            <View style={styles.resultRow}>
              <ThemedText type="body" secondary>{t('zakatCalculator.meetsNisab')}:</ThemedText>
              <ThemedText type="body" style={{ color: result.meetsNisab ? theme.primary : '#EF4444' }}>
                {result.meetsNisab ? t('common.yes') : t('common.no')}
              </ThemedText>
            </View>
            <View style={[styles.zakatDueSection, { backgroundColor: `${theme.primary}1A` }]}>
              <ThemedText type="body" secondary>{t('zakatCalculator.zakatDue')}</ThemedText>
              <ThemedText type="h2" style={{ color: accentColor }}>{formatCurrency(result.zakatDue)}</ThemedText>
            </View>
          </Card>
        )}

        <Card elevation={1} style={styles.infoCard} onPress={Keyboard.dismiss}>
          <Feather name="info" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <ThemedText type="small" secondary style={styles.infoText}>
            {t('zakatCalculator.info')}
          </ThemedText>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: { padding: Spacing.xs },
  title: { fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  card: { marginBottom: Spacing.lg },
  label: { fontWeight: '600', marginBottom: Spacing.sm },
  input: { padding: Spacing.md, borderRadius: BorderRadius.lg, fontSize: 18, marginBottom: Spacing.lg },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  resultCard: { marginBottom: Spacing.lg },
  resultTitle: { marginBottom: Spacing.md },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  zakatDueSection: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  infoText: { flex: 1 },
});
