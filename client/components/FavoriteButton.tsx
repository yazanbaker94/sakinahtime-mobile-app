/**
 * FavoriteButton Component
 * 
 * Toggle button for favoriting duas with animated feedback.
 */

import React, { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/theme';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  disabled?: boolean;
}

export function FavoriteButton({ 
  isFavorite, 
  onToggle, 
  size = 24,
  disabled = false,
}: FavoriteButtonProps) {
  const { isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animate on favorite change
  useEffect(() => {
    if (isFavorite) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFavorite, scaleAnim]);

  const handlePress = () => {
    if (!disabled) {
      onToggle();
    }
  };

  const favoriteColor = isDark ? '#F87171' : '#EF4444';
  const inactiveColor = isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed || disabled ? 0.6 : 1 },
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Feather
          name={isFavorite ? 'heart' : 'heart'}
          size={size}
          color={isFavorite ? favoriteColor : inactiveColor}
          style={isFavorite ? styles.filled : undefined}
        />
        {isFavorite && (
          <Feather
            name="heart"
            size={size}
            color={favoriteColor}
            style={[styles.filledOverlay, { position: 'absolute' }]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
  filled: {
    // Heart is filled when favorited
  },
  filledOverlay: {
    // Overlay for filled effect
  },
});

export default FavoriteButton;
