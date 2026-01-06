/**
 * HifzModeToggle
 * Floating button to enter/exit Hifz (memorization) mode
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useTheme } from '../../hooks/useTheme';
import { HIFZ_ACTIVE_COLOR } from '../../constants/hifz';
import { ThemedText } from '../ThemedText';

interface HifzModeToggleProps {
  style?: any;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  onLongPress?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function HifzModeToggle({ 
  style, 
  showLabel = true,
  size = 'medium',
  onLongPress,
}: HifzModeToggleProps) {
  const { isActive, toggleHifzMode } = useHifzMode();
  const { isDark, theme } = useTheme();

  const activeColor = isDark ? HIFZ_ACTIVE_COLOR.dark : HIFZ_ACTIVE_COLOR.light;
  const inactiveColor = isDark ? theme.cardBackground : theme.backgroundDefault;
  const textColor = isActive ? '#FFFFFF' : theme.text;

  const buttonSize = size === 'small' ? 40 : size === 'large' ? 56 : 48;
  const iconSize = size === 'small' ? 18 : size === 'large' ? 26 : 22;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isActive ? activeColor : inactiveColor, { duration: 200 }),
      transform: [
        { scale: withSpring(isActive ? 1.05 : 1, { damping: 15 }) },
      ],
    };
  }, [isActive, activeColor, inactiveColor]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: withSpring(isActive ? '10deg' : '0deg', { damping: 15 }) },
      ],
    };
  }, [isActive]);

  const handlePress = () => {
    toggleHifzMode();
  };

  const handleLongPress = () => {
    if (isActive && onLongPress) {
      onLongPress();
    }
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={isActive ? 'Hifz mode active. Tap to deactivate, long press for controls' : 'Activate Hifz memorization mode'}
      accessibilityState={{ selected: isActive }}
      accessibilityHint={isActive ? 'Long press to open Hifz control panel' : 'Enables verse hiding for memorization practice'}
      style={[
        styles.button,
        {
          width: showLabel ? 'auto' : buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          borderColor: isActive ? activeColor : theme.border,
        },
        animatedStyle,
        style,
      ]}
      activeOpacity={0.8}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Feather
          name="book-open"
          size={iconSize}
          color={textColor}
        />
      </Animated.View>
      {showLabel && (
        <ThemedText
          style={[
            styles.label,
            { color: textColor, fontSize: size === 'small' ? 12 : 14 },
          ]}
        >
          Hifz
        </ThemedText>
      )}
      {/* Small settings indicator when active - hints at long-press */}
      {isActive && onLongPress && (
        <View style={styles.settingsHint}>
          <Feather name="settings" size={10} color="#FFFFFF" />
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    marginLeft: 8,
    fontWeight: '600',
  },
  settingsHint: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HifzModeToggle;
