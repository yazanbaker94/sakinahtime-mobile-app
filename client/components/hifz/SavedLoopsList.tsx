/**
 * SavedLoopsList
 * Component for displaying and managing saved audio loops
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../ThemedText';
import type { SavedLoop } from '../../types/hifz';

interface SavedLoopsListProps {
  onSelectLoop?: (loop: SavedLoop) => void;
  style?: any;
}

export function SavedLoopsList({ onSelectLoop, style }: SavedLoopsListProps) {
  const { isDark, theme } = useTheme();
  const {
    savedLoops,
    loopRange,
    saveCurrentLoop,
    deleteLoop,
    loadLoop,
  } = useHifzMode();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loopName, setLoopName] = useState('');

  const activeColor = theme.primary;

  const handleSaveLoop = useCallback(async () => {
    if (!loopName.trim()) {
      Alert.alert('Error', 'Please enter a name for the loop');
      return;
    }

    if (!loopRange.start || !loopRange.end) {
      Alert.alert('Error', 'Please set a loop range first');
      return;
    }

    await saveCurrentLoop(loopName.trim());
    setLoopName('');
    setShowSaveModal(false);
  }, [loopName, loopRange, saveCurrentLoop]);

  const handleDeleteLoop = useCallback((loopId: string, loopName: string) => {
    Alert.alert(
      'Delete Loop',
      `Are you sure you want to delete "${loopName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteLoop(loopId),
        },
      ]
    );
  }, [deleteLoop]);

  const handleSelectLoop = useCallback((loop: SavedLoop) => {
    loadLoop(loop);
    onSelectLoop?.(loop);
  }, [loadLoop, onSelectLoop]);

  const canSave = loopRange.start && loopRange.end;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Saved Loops</ThemedText>
        <TouchableOpacity
          onPress={() => setShowSaveModal(true)}
          disabled={!canSave}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save current loop"
          accessibilityState={{ disabled: !canSave }}
          accessibilityHint={canSave ? 'Tap to save the current loop range' : 'Set a loop range first'}
          style={[
            styles.saveButton,
            {
              backgroundColor: canSave ? activeColor : theme.backgroundSecondary,
            },
          ]}
        >
          <Feather
            name="plus"
            size={16}
            color={canSave ? '#FFFFFF' : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.saveButtonText,
              { color: canSave ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Save Current
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Save Modal */}
      {showSaveModal && (
        <View style={[styles.saveModal, { backgroundColor: theme.backgroundSecondary }]}>
          <TextInput
            value={loopName}
            onChangeText={setLoopName}
            placeholder="Enter loop name..."
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.nameInput,
              {
                backgroundColor: theme.cardBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={() => {
                setShowSaveModal(false);
                setLoopName('');
              }}
              style={[styles.modalButton, { borderColor: theme.border }]}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveLoop}
              style={[styles.modalButton, { backgroundColor: activeColor }]}
            >
              <ThemedText style={{ color: '#FFFFFF' }}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loops List */}
      {savedLoops.length > 0 ? (
        <View style={styles.listContent}>
          {savedLoops.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelectLoop(item)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Saved loop ${item.name}, from ${item.startVerse} to ${item.endVerse}`}
              accessibilityHint="Tap to load this loop"
              style={[styles.loopItem, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
            >
              <View style={styles.loopInfo}>
                <ThemedText style={styles.loopName}>{item.name}</ThemedText>
                <ThemedText style={[styles.loopRange, { color: theme.textSecondary }]}>
                  {item.startVerse} → {item.endVerse}
                </ThemedText>
              </View>
              <View style={styles.loopActions}>
                <TouchableOpacity
                  onPress={() => handleSelectLoop(item)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Play loop ${item.name}`}
                  style={[styles.playButton, { backgroundColor: `${activeColor}20` }]}
                >
                  <Feather name="play" size={16} color={activeColor} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteLoop(item.id, item.name)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete loop ${item.name}`}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Feather name="repeat" size={32} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            No saved loops yet
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveModal: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  nameInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  loopInfo: {
    flex: 1,
  },
  loopName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  loopRange: {
    fontSize: 13,
  },
  loopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
  },
});

export default SavedLoopsList;
