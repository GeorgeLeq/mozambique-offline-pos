/**
 * @file useFeatureGate.ts
 * @description Custom hook for gating features, checking unlocked state,
 * and triggering the dynamic upgrade / activation modal.
 */

import { useCallback } from 'react';
import { FeatureKey, FeatureEntitlement } from './types';
import { useSubscription } from './subscriptionContext';

export function useFeatureGate(featureKey: FeatureKey) {
  const { 
    isFeatureUnlocked, 
    getFeatureDetails, 
    openFeatureLockModal 
  } = useSubscription();

  const isUnlocked = isFeatureUnlocked(featureKey);
  const isLocked = !isUnlocked;
  const feature: FeatureEntitlement | undefined = getFeatureDetails(featureKey);

  const requireFeature = useCallback((customTitle?: string, customReason?: string): boolean => {
    if (isUnlocked) {
      return true;
    }
    openFeatureLockModal(featureKey, customTitle, customReason);
    return false;
  }, [isUnlocked, featureKey, openFeatureLockModal]);

  const triggerLockModal = useCallback((customTitle?: string, customReason?: string) => {
    openFeatureLockModal(featureKey, customTitle, customReason);
  }, [featureKey, openFeatureLockModal]);

  return {
    isUnlocked,
    isLocked,
    feature,
    requireFeature,
    triggerLockModal
  };
}
