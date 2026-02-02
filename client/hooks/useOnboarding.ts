/**
 * Hook to manage onboarding state
 * Tracks whether user has completed first-time onboarding
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_completed';

interface UseOnboardingReturn {
    isLoading: boolean;
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
    const [isLoading, setIsLoading] = useState(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            const value = await AsyncStorage.getItem(ONBOARDING_KEY);
            setHasCompletedOnboarding(value === 'true');
        } catch (error) {
            console.warn('[useOnboarding] Failed to check status:', error);
            // Default to not completed on error
            setHasCompletedOnboarding(false);
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = useCallback(async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            setHasCompletedOnboarding(true);
        } catch (error) {
            console.warn('[useOnboarding] Failed to save status:', error);
        }
    }, []);

    const resetOnboarding = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(ONBOARDING_KEY);
            setHasCompletedOnboarding(false);
        } catch (error) {
            console.warn('[useOnboarding] Failed to reset status:', error);
        }
    }, []);

    return {
        isLoading,
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
    };
}
