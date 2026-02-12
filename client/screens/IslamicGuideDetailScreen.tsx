import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Feather } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type IslamicGuideDetailScreenRouteProp = RouteProp<RootStackParamList, "IslamicGuideDetail">;

const REF_MAP: Record<string, string> = {
  'Sahih al-Bukhari': 'صحيح البخاري',
  'Sahih Muslim': 'صحيح مسلم',
  'Sunan Abu Dawud': 'سنن أبي داود',
  'Sunan Ibn Majah': 'سنن ابن ماجه',
  'Sunan at-Tirmidhi': 'سنن الترمذي',
  'Tirmidhi': 'الترمذي',
  'Quran': 'القرآن الكريم',
  'AAOIFI Sharia Standards': 'معايير هيئة المحاسبة والمراجعة للمؤسسات المالية الإسلامية',
  'Islamic Finance Standards by AAOIFI': 'معايير التمويل الإسلامي - أيوفي',
};

function toArabicNumerals(str: string): string {
  return str.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

function translateReference(ref: string): string {
  for (const [en, ar] of Object.entries(REF_MAP)) {
    if (ref.startsWith(en)) {
      return toArabicNumerals(ar + ref.slice(en.length));
    }
  }
  return ref;
}

interface Props {
  route: IslamicGuideDetailScreenRouteProp;
}

export default function IslamicGuideDetailScreen({ route }: Props) {
  const { guide } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, locale } = useTranslation();
  const isAr = locale === 'ar';
  const navigation = useNavigation();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + Spacing.md,
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitles}>
          <ThemedText type={isAr ? 'arabic' : 'h3'} style={isAr ? { fontSize: 18, fontFamily: 'AlMushafQuran', fontWeight: '700' } : { fontWeight: '700' }} numberOfLines={1}>
            {t(`guides.${guide.id}.title`)}
          </ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <View
          style={[
            styles.descriptionCard,
            {
              backgroundColor: `${theme.primary}15`,
            },
          ]}
        >
          <ThemedText type={isAr ? 'arabic' : 'body'} secondary style={isAr ? styles.descriptionAr : undefined}>
            {t(`guides.${guide.id}.description`)}
          </ThemedText>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {guide.steps.map((step, index) => (
            <View
              key={index}
              style={[
                styles.stepCard,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <View style={styles.stepHeader}>
                <View
                  style={[
                    styles.stepNumber,
                    {
                      backgroundColor: `${theme.primary}20`,
                    },
                  ]}
                >
                  <ThemedText
                    type="body"
                    style={{
                      color: theme.primary,
                      fontWeight: "700",
                    }}
                  >
                    {index + 1}
                  </ThemedText>
                </View>
                <View style={styles.stepTitles}>
                  <ThemedText type={isAr ? 'arabic' : 'h4'} style={isAr ? styles.stepTitleAr : styles.stepTitle}>
                    {t(`guides.${guide.id}.steps.${index}.title`)}
                  </ThemedText>
                </View>
              </View>

              <ThemedText type={isAr ? 'arabic' : 'body'} style={isAr ? styles.stepContentAr : styles.stepContent}>
                {t(`guides.${guide.id}.steps.${index}.content`)}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* References */}
        {guide.references && guide.references.length > 0 && (
          <View
            style={[
              styles.referencesCard,
              {
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
          >
            <View style={styles.referencesHeader}>
              <Feather
                name="book"
                size={18}
                color={theme.primary}
              />
              <ThemedText
                type="body"
                style={{
                  marginLeft: Spacing.sm,
                  fontWeight: "600",
                  color: theme.primary,
                }}
              >
                {t('islamicGuide.references')}
              </ThemedText>
            </View>
            {guide.references.map((ref, index) => (
              <View key={index} style={styles.referenceItem}>
                <Feather
                  name="check"
                  size={14}
                  color={theme.textSecondary}
                />
                <ThemedText type="small" secondary style={styles.referenceText}>
                  {isAr ? translateReference(ref) : ref}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    width: 40,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  descriptionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  descriptionAr: {
    fontFamily: "AlMushafQuran",
    fontSize: 15,
    marginTop: Spacing.sm,
  },
  stepsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  stepHeader: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitles: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  stepTitle: {
    marginBottom: Spacing.xs,
  },
  stepTitleAr: {
    fontFamily: "AlMushafQuran",
    fontSize: 14,
  },
  stepContent: {
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  stepContentAr: {
    fontFamily: "AlMushafQuran",
    fontSize: 15,
    lineHeight: 24,
  },
  referencesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  referencesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  referenceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  referenceText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
});
