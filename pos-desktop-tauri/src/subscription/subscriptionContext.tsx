/**
 * @file subscriptionContext.tsx
 * @description Global React Context for Offline-First Subscriptions,
 * dynamic feature gating, M-Pesa / E-Mola payment submission, and offline unlock codes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { FeatureEntitlement, FeatureKey, PaymentProofSubmission, SubscriptionPlan } from './types';
import { 
  DEFAULT_PLANS, 
  loadEntitlementsFromDb, 
  loadPlansFromDb,
  unlockFeatureInDb, 
  savePaymentSubmissionInDb, 
  loadPaymentSubmissionsFromDb 
} from './subscriptionDb';
import { 
  getPersistentDeviceId, 
  getPersistentShopId, 
  getHardwareFingerprint,
  validateOfflineActivationCode, 
  checkClockTampering 
} from './cryptoLicense';
import { getDB } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncSubscriptionsFromCloud } from '../lib/syncEngine/subscriptions';
import toast from 'react-hot-toast';

interface SubscriptionContextType {
  entitlements: Record<string, FeatureEntitlement>;
  plans: SubscriptionPlan[];
  payments: PaymentProofSubmission[];
  shopId: string;
  deviceId: string;
  hardwareFingerprint: string;
  isProActive: boolean;
  activePlanName: string;
  daysRemaining: number | null;
  
  isFeatureUnlocked: (featureKey: FeatureKey | string) => boolean;
  getFeatureDetails: (featureKey: FeatureKey | string) => FeatureEntitlement | undefined;
  unlockWithCode: (code: string) => { success: boolean; message: string; featureKey?: string };
  submitPaymentProof: (data: {
    planId: string;
    featureKey: string;
    amountMt: number;
    paymentMethod: 'mpesa' | 'emola';
    referenceCode: string;
    phoneNumber?: string;
    screenshotUrl?: string;
  }) => Promise<{ success: boolean; message: string }>;
  refreshEntitlements: () => Promise<void>;

  // Modal controls
  activeLockModalFeature: FeatureKey | null;
  lockModalCustomTitle?: string;
  lockModalCustomReason?: string;
  openFeatureLockModal: (featureKey: FeatureKey, customTitle?: string, customReason?: string) => void;
  closeFeatureLockModal: () => void;

  isOfflineUnlockOpen: boolean;
  setIsOfflineUnlockOpen: (open: boolean) => void;

  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;

  targetPlanForPayment: SubscriptionPlan | null;
  setTargetPlanForPayment: (plan: SubscriptionPlan | null) => void;

  // Full page view
  isSubscriptionPageOpen: boolean;
  openSubscriptionPage: () => void;
  closeSubscriptionPage: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [entitlements, setEntitlements] = useState<Record<string, FeatureEntitlement>>({});
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [payments, setPayments] = useState<PaymentProofSubmission[]>([]);
  const [shopId, setShopId] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [hardwareFingerprint, setHardwareFingerprint] = useState<string>(getHardwareFingerprint());
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [activeLockModalFeature, setActiveLockModalFeature] = useState<FeatureKey | null>(null);
  const [lockModalCustomTitle, setLockModalCustomTitle] = useState<string | undefined>();
  const [lockModalCustomReason, setLockModalCustomReason] = useState<string | undefined>();
  const [isOfflineUnlockOpen, setIsOfflineUnlockOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetPlanForPayment, setTargetPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [isSubscriptionPageOpen, setIsSubscriptionPageOpen] = useState(false);

  // Hydrate shop, device, and entitlements
  const refreshEntitlements = useCallback(async () => {
    try {
      // 1. First retrieve real shop_id and device_id from SQLite settings table
      let sId = getPersistentShopId();
      let dId = getPersistentDeviceId();

      try {
        const db = await getDB();
        const settingsRows = await db.select(
          "SELECT key, value FROM settings WHERE key IN ('shop_id', 'device_id')"
        ) as { key: string; value: string }[];

        const realShopId = settingsRows?.find(s => s.key === 'shop_id')?.value;
        const realDeviceId = settingsRows?.find(s => s.key === 'device_id')?.value;

        if (realShopId) {
          sId = realShopId;
          if (typeof window !== 'undefined') localStorage.setItem('pos_shop_id', realShopId);
        }
        if (realDeviceId) {
          dId = realDeviceId;
          if (typeof window !== 'undefined') localStorage.setItem('pos_hardware_device_id', realDeviceId);
        }
      } catch (dbErr) {
        console.warn('[SubscriptionContext] SQLite settings read fallback:', dbErr);
      }

      setShopId(sId);
      setDeviceId(dId);
      const currentHwId = getHardwareFingerprint();
      setHardwareFingerprint(currentHwId);

      // Proactively backfill hardware_fingerprint to Supabase devices table immediately
      if (isSupabaseConfigured() && dId && navigator.onLine) {
        (async () => {
          try {
            const { error } = await supabase
              .from('devices')
              .update({ 
                hardware_fingerprint: currentHwId,
                last_seen_at: new Date().toISOString()
              })
              .eq('id', dId);

            if (error) {
              console.warn('[SubscriptionContext] Immediate HWID sync note:', error.message);
            } else {
              console.log('[SubscriptionContext] Successfully synced HWID to Supabase devices table:', currentHwId);
            }
          } catch (err) {
            console.warn('[SubscriptionContext] Immediate HWID sync catch:', err);
          }
        })();
      }

      // Check for monotonic clock tampering
      checkClockTampering();

      const [loadedEntitlements, loadedPlans, loadedPayments] = await Promise.all([
        loadEntitlementsFromDb(),
        loadPlansFromDb(),
        loadPaymentSubmissionsFromDb()
      ]);

      setEntitlements(loadedEntitlements);
      if (loadedPlans && loadedPlans.length > 0) {
        setPlans(loadedPlans);
      }
      setPayments(loadedPayments);
    } catch (err) {
      console.error('[SubscriptionContext] Error loading entitlements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEntitlements();

    // Trigger cloud synchronization immediately if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncSubscriptionsFromCloud().catch(err => {
        console.warn('[SubscriptionContext] Initial cloud subscription sync warning:', err);
      });
    }

    // Listen to background sync engine updates
    const handleEntitlementsUpdated = () => {
      console.log('[SubscriptionContext] Remote entitlements updated! Refreshing...');
      refreshEntitlements();
    };

    const handlePaymentsUpdated = () => {
      refreshEntitlements();
    };

    const handlePlansUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setPlans(e.detail);
      }
    };

    const handleOnlineOrFocus = () => {
      if (navigator.onLine) {
        syncSubscriptionsFromCloud().catch(console.warn);
      }
    };

    window.addEventListener('subscription-entitlements-updated', handleEntitlementsUpdated);
    window.addEventListener('subscription-payments-updated', handlePaymentsUpdated);
    window.addEventListener('subscription-plans-updated', handlePlansUpdated as EventListener);
    window.addEventListener('online', handleOnlineOrFocus);
    window.addEventListener('focus', handleOnlineOrFocus);

    return () => {
      window.removeEventListener('subscription-entitlements-updated', handleEntitlementsUpdated);
      window.removeEventListener('subscription-payments-updated', handlePaymentsUpdated);
      window.removeEventListener('subscription-plans-updated', handlePlansUpdated as EventListener);
      window.removeEventListener('online', handleOnlineOrFocus);
      window.removeEventListener('focus', handleOnlineOrFocus);
    };
  }, [refreshEntitlements]);

  // Check if a given feature is currently unlocked
  const isFeatureUnlocked = useCallback((featureKey: FeatureKey | string): boolean => {
    const ent = entitlements[featureKey];
    if (!ent) {
      // Security-gated features are locked by default if uninitialized
      if (
        featureKey === 'cloud_backup' ||
        featureKey === 'custom_permissions' ||
        featureKey === 'advanced_audits' ||
        featureKey === 'unlimited_users' ||
        featureKey === 'companion_app'
      ) {
        return false;
      }
      return true; // Unknown features not declared in gates are treated as free
    }
    if (!ent.is_unlocked) return false;

    // Check expiration if applicable
    if (ent.expires_at) {
      const exp = new Date(ent.expires_at).getTime();
      if (Date.now() > exp) {
        return false;
      }
    }
    return true;
  }, [entitlements]);

  const getFeatureDetails = useCallback((featureKey: FeatureKey | string): FeatureEntitlement | undefined => {
    return entitlements[featureKey];
  }, [entitlements]);

  // Compute overall subscription status
  const { isProActive, activePlanName, daysRemaining } = useMemo(() => {
    const list = Object.values(entitlements) as FeatureEntitlement[];
    const proEntitlements = list.filter(e => e.plan_tier === 'pro' && e.is_unlocked);
    const hasPro = proEntitlements.length > 0;

    let minDays: number | null = null;
    proEntitlements.forEach(e => {
      if (e.expires_at) {
        const diffMs = new Date(e.expires_at).getTime() - Date.now();
        const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (minDays === null || diffDays < minDays) {
          minDays = diffDays;
        }
      }
    });

    return {
      isProActive: hasPro,
      activePlanName: hasPro ? 'Plano Pro Ativo' : 'Plano Grátis / Essencial',
      daysRemaining: minDays
    };
  }, [entitlements]);

  // Unlock with an offline code (e.g. MZPOS-XXXX-XXXX-XXXX)
  const unlockWithCode = useCallback((code: string) => {
    const result = validateOfflineActivationCode(code, shopId, deviceId);

    if (!result.isValid || !result.featureKey) {
      return { success: false, message: result.message };
    }

    const durationDays = result.days || 30;
    unlockFeatureInDb(result.featureKey, durationDays, 'license_code');
    refreshEntitlements();

    toast.success(result.message, { duration: 5000 });
    return { success: true, message: result.message, featureKey: result.featureKey };
  }, [shopId, deviceId, refreshEntitlements]);

  // Submit payment proof (M-Pesa or E-Mola)
  const submitPaymentProof = useCallback(async (data: {
    planId: string;
    featureKey: string;
    amountMt: number;
    paymentMethod: 'mpesa' | 'emola';
    referenceCode: string;
    phoneNumber?: string;
    screenshotUrl?: string;
  }) => {
    try {
      const record = await savePaymentSubmissionInDb({
        shop_id: shopId,
        device_id: deviceId,
        feature_key: data.featureKey,
        plan_id: data.planId,
        amount_mt: data.amountMt,
        payment_method: data.paymentMethod,
        reference_code: data.referenceCode,
        phone_number: data.phoneNumber,
        screenshot_url: data.screenshotUrl
      });

      // Optimistically inform the user and reload payments list
      await refreshEntitlements();

      // Immediate cloud upload if online and configured
      if (isSupabaseConfigured() && navigator.onLine) {
        (async () => {
          try {
            const { error } = await supabase
              .from('payment_submissions')
              .upsert({
                id: record.id,
                shop_id: record.shop_id,
                device_id: record.device_id || null,
                plan_id: record.plan_id,
                feature_key: record.feature_key,
                amount_mt: record.amount_mt,
                payment_method: record.payment_method,
                reference_code: record.reference_code,
                phone_number: record.phone_number || null,
                screenshot_url: record.screenshot_url || null,
                status: 'pending',
                submitted_at: record.submitted_at
              }, { onConflict: 'id' });

            if (!error) {
              const db = await getDB();
              await db.execute('UPDATE subscription_payments SET sync_status = 1 WHERE id = ?', [record.id]);
            }
          } catch (pushErr) {
            console.warn('[SubscriptionContext] Cloud push queued for background sync:', pushErr);
          }
        })();
      }

      return { 
        success: true, 
        message: 'Comprovativo registado com sucesso! A nossa equipa central irá validar o pagamento.' 
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: `Erro ao registar comprovativo: ${err.message || 'Tente novamente'}` 
      };
    }
  }, [shopId, deviceId, refreshEntitlements]);

  // Modal open/close actions
  const openFeatureLockModal = useCallback((featureKey: FeatureKey, customTitle?: string, customReason?: string) => {
    setActiveLockModalFeature(featureKey);
    setLockModalCustomTitle(customTitle);
    setLockModalCustomReason(customReason);
  }, []);

  const closeFeatureLockModal = useCallback(() => {
    setActiveLockModalFeature(null);
    setLockModalCustomTitle(undefined);
    setLockModalCustomReason(undefined);
  }, []);

  const openSubscriptionPage = useCallback(() => {
    setIsSubscriptionPageOpen(true);
  }, []);

  const closeSubscriptionPage = useCallback(() => {
    setIsSubscriptionPageOpen(false);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        entitlements,
        plans,
        payments,
        shopId,
        deviceId,
        hardwareFingerprint,
        isProActive,
        activePlanName,
        daysRemaining,
        isFeatureUnlocked,
        getFeatureDetails,
        unlockWithCode,
        submitPaymentProof,
        refreshEntitlements,
        activeLockModalFeature,
        lockModalCustomTitle,
        lockModalCustomReason,
        openFeatureLockModal,
        closeFeatureLockModal,
        isOfflineUnlockOpen,
        setIsOfflineUnlockOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        targetPlanForPayment,
        setTargetPlanForPayment,
        isSubscriptionPageOpen,
        openSubscriptionPage,
        closeSubscriptionPage
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
