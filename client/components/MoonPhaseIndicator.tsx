/**
 * MoonPhaseIndicator Component
 * 
 * Displays moon icon based on phase with illumination percentage.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MoonPhase } from '../types/hijri';
import { moonPhaseService } from '../services/MoonPhaseService';

interface MoonPhaseIndicatorProps {
  phase: MoonPhase;
  size?: 'small' | 'medium' | 'large';
  showIllumination?: boolean;
  showLabel?: boolean;
  isDark?: boolean;
}

const SIZES = {
  small: { icon: 20, label: 10 },
  medium: { icon: 32, label: 12 },
  large: { icon: 48, label: 14 },
};

export function MoonPhaseIndicator({
  phase,
  size = 'medium',
  showIllumination = false,
  showLabel = false,
  isDark = false,
}: MoonPhaseIndicatorProps) {
  const sizeConfig = SIZES[size];
  const textColor = isDark ? '#A7F3D0' : '#6B7280';
  
  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { fontSize: sizeConfig.icon }]}>
        {phase.icon}
      </Text>
      {showIllumination && (
        <Text style={[styles.illumination, { fontSize: sizeConfig.label, color: textColor }]}>
          {phase.illumination}%
        </Text>
      )}
      {showLabel && (
        <Text style={[styles.label, { fontSize: sizeConfig.label, color: textColor }]}>
          {moonPhaseService.getPhaseName(phase.phase)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  illumination: {
    marginTop: 2,
  },
  label: {
    marginTop: 2,
    textAlign: 'center',
  },
});
