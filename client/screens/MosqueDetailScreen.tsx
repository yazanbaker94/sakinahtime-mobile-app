/**
 * MosqueDetailScreen - Detail screen showing full mosque information
 * Displays name, address, phone, website, photos, ratings, and hours
 */

import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, Colors, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { useMosqueDetail } from '@/hooks/useMosqueFinder';
import { MapsIntegrationService } from '@/services/MapsIntegrationService';
import { formatDistance } from '@/constants/mosque';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/RootStackNavigator';
import * as Haptics from 'expo-haptics';

type RouteProps = RouteProp<RootStackParamList, 'MosqueDetail'>;

export default function MosqueDetailScreen() {
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { mosqueId, mosque: initialMosque } = route.params;

  const { mosque, isLoading, error, refetch } = useMosqueDetail(mosqueId, initialMosque);

  const handleDirections = async () => {
    if (!mosque) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await MapsIntegrationService.openDirections({
      latitude: mosque.latitude,
      longitude: mosque.longitude,
      name: mosque.name,
    });
  };

  const handleCall = () => {
    if (!mosque?.phoneNumber) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${mosque.phoneNumber}`);
  };

  const handleWebsite = () => {
    if (!mosque?.website) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(mosque.website);
  };

  if (isLoading && !mosque) {
    return (
      <SafeAreaView 
        style={[styles.container, { 
          backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault 
        }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather 
              name="arrow-left" 
              size={24} 
              color={isDark ? Colors.dark.text : Colors.light.text} 
            />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>Mosque Details</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={isDark ? Colors.dark.primary : Colors.light.primary} 
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !mosque) {
    return (
      <SafeAreaView 
        style={[styles.container, { 
          backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault 
        }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather 
              name="arrow-left" 
              size={24} 
              color={isDark ? Colors.dark.text : Colors.light.text} 
            />
          </Pressable>
          <ThemedText type="h3" style={styles.headerTitle}>Mosque Details</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#EF4444" />
          <ThemedText type="body" style={styles.errorTitle}>
            Failed to load details
          </ThemedText>
          <ThemedText type="small" secondary style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable
            onPress={refetch}
            style={[styles.retryButton, {
              backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
            }]}
          >
            <ThemedText type="body" style={{ color: '#FFFFFF' }}>
              Try Again
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!mosque) return null;

  return (
    <SafeAreaView 
      style={[styles.container, { 
        backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault 
      }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather 
            name="arrow-left" 
            size={24} 
            color={isDark ? Colors.dark.text : Colors.light.text} 
          />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle} numberOfLines={1}>
          {mosque.name}
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos */}
        {mosque.photos && mosque.photos.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.photosContainer}
            contentContainerStyle={styles.photosContent}
          >
            {mosque.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        {/* Main Info Card */}
        <View style={[styles.card, {
          backgroundColor: isDark 
            ? Colors.dark.backgroundSecondary 
            : Colors.light.backgroundSecondary,
        }]}>
          <ThemedText type="h3" style={styles.mosqueName}>
            {mosque.name}
          </ThemedText>

          {/* Rating */}
          {mosque.rating !== undefined && (
            <View style={styles.ratingRow}>
              <Feather name="star" size={18} color="#F59E0B" />
              <ThemedText type="body" style={styles.ratingText}>
                {mosque.rating.toFixed(1)}
              </ThemedText>
              {mosque.reviewCount !== undefined && (
                <ThemedText type="small" secondary>
                  ({mosque.reviewCount} reviews)
                </ThemedText>
              )}
            </View>
          )}

          {/* Distance */}
          <View style={styles.infoRow}>
            <Feather 
              name="map-pin" 
              size={18} 
              color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
            />
            <ThemedText type="body" secondary style={styles.infoText}>
              {formatDistance(mosque.distance)} away
            </ThemedText>
          </View>

          {/* Open/Closed Status */}
          {mosque.isOpen !== undefined && (
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: mosque.isOpen 
                  ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                  : (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)'),
              }
            ]}>
              <ThemedText 
                type="body" 
                style={{ 
                  color: mosque.isOpen 
                    ? (isDark ? Colors.dark.primary : Colors.light.primary)
                    : '#EF4444',
                  fontWeight: '600',
                }}
              >
                {mosque.isOpen ? 'Open Now' : 'Closed'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Address Card */}
        <View style={[styles.card, {
          backgroundColor: isDark 
            ? Colors.dark.backgroundSecondary 
            : Colors.light.backgroundSecondary,
        }]}>
          <View style={styles.cardHeader}>
            <Feather 
              name="map" 
              size={20} 
              color={isDark ? Colors.dark.primary : Colors.light.primary} 
            />
            <ThemedText type="body" style={styles.cardTitle}>Address</ThemedText>
          </View>
          <ThemedText type="body" secondary style={styles.addressText}>
            {mosque.address}
          </ThemedText>
        </View>

        {/* Contact Card */}
        {(mosque.phoneNumber || mosque.website) && (
          <View style={[styles.card, {
            backgroundColor: isDark 
              ? Colors.dark.backgroundSecondary 
              : Colors.light.backgroundSecondary,
          }]}>
            <View style={styles.cardHeader}>
              <Feather 
                name="phone" 
                size={20} 
                color={isDark ? Colors.dark.primary : Colors.light.primary} 
              />
              <ThemedText type="body" style={styles.cardTitle}>Contact</ThemedText>
            </View>
            
            {mosque.phoneNumber && (
              <Pressable onPress={handleCall} style={styles.contactRow}>
                <Feather 
                  name="phone" 
                  size={16} 
                  color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
                />
                <ThemedText type="body" style={styles.contactText}>
                  {mosque.phoneNumber}
                </ThemedText>
                <Feather 
                  name="external-link" 
                  size={16} 
                  color={isDark ? Colors.dark.primary : Colors.light.primary} 
                />
              </Pressable>
            )}
            
            {mosque.website && (
              <Pressable onPress={handleWebsite} style={styles.contactRow}>
                <Feather 
                  name="globe" 
                  size={16} 
                  color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
                />
                <ThemedText type="body" style={styles.contactText} numberOfLines={1}>
                  {mosque.website.replace(/^https?:\/\//, '')}
                </ThemedText>
                <Feather 
                  name="external-link" 
                  size={16} 
                  color={isDark ? Colors.dark.primary : Colors.light.primary} 
                />
              </Pressable>
            )}
          </View>
        )}

        {/* Opening Hours Card */}
        {mosque.openingHours && mosque.openingHours.weekdayText.length > 0 && (
          <View style={[styles.card, {
            backgroundColor: isDark 
              ? Colors.dark.backgroundSecondary 
              : Colors.light.backgroundSecondary,
          }]}>
            <View style={styles.cardHeader}>
              <Feather 
                name="clock" 
                size={20} 
                color={isDark ? Colors.dark.primary : Colors.light.primary} 
              />
              <ThemedText type="body" style={styles.cardTitle}>Opening Hours</ThemedText>
            </View>
            {mosque.openingHours.weekdayText.map((text, index) => (
              <ThemedText key={index} type="small" secondary style={styles.hoursText}>
                {text}
              </ThemedText>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Get Directions Button */}
      <View style={[styles.bottomBar, {
        backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault,
        borderTopColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
        paddingBottom: insets.bottom + Spacing.md,
      }]}>
        <Pressable
          onPress={handleDirections}
          style={[styles.directionsButton, {
            backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
          }]}
        >
          <Feather name="navigation" size={20} color="#FFFFFF" />
          <ThemedText type="body" style={styles.directionsText}>
            Get Directions
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  photosContainer: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.md,
  },
  photosContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  photo: {
    width: 280,
    height: 180,
    borderRadius: BorderRadius.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  mosqueName: {
    marginBottom: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  ratingText: {
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontWeight: '600',
  },
  addressText: {
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  contactText: {
    flex: 1,
  },
  hoursText: {
    paddingVertical: Spacing.xs,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  directionsText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
