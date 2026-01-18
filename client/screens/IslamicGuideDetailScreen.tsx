import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type IslamicGuideDetailScreenRouteProp = RouteProp<RootStackParamList, "IslamicGuideDetail">;

interface Props {
  route: IslamicGuideDetailScreenRouteProp;
}

export default function IslamicGuideDetailScreen({ route }: Props) {
  const { guide } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
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
          <ThemedText type="h3" style={{ fontWeight: '700' }} numberOfLines={1}>
            {guide.title}
          </ThemedText>
          <ThemedText type="arabic" secondary style={{ fontSize: 14, fontFamily: 'AlMushafQuran' }}>
            {guide.titleAr}
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
          <ThemedText type="body" secondary>
            {guide.description}
          </ThemedText>
          {guide.descriptionAr && (
            <ThemedText type="arabic" secondary style={styles.descriptionAr}>
              {guide.descriptionAr}
            </ThemedText>
          )}
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
                  <ThemedText type="h4" style={styles.stepTitle}>
                    {step.title}
                  </ThemedText>
                  {step.titleAr && (
                    <ThemedText type="arabic" secondary style={styles.stepTitleAr}>
                      {step.titleAr}
                    </ThemedText>
                  )}
                </View>
              </View>

              <ThemedText type="body" style={styles.stepContent}>
                {step.content}
              </ThemedText>

              {step.contentAr && (
                <ThemedText type="arabic" secondary style={styles.stepContentAr}>
                  {step.contentAr}
                </ThemedText>
              )}
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
                References
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
                  {ref}
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
