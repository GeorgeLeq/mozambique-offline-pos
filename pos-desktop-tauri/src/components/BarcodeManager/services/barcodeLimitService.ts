/**
 * @file barcodeLimitService.ts
 * @description Offline-first barcode quota and generation capacity enforcement.
 * Enforces dynamic limits based on active local/cloud subscription plans and Command Central overrides.
 */

import { getDB } from '../../../lib/db';

export interface BarcodeLimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  message?: string;
}

export interface BarcodeUsageSummary {
  current: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
  isUnlimited: boolean;
  percentage: number;
}

/**
 * Checks if generating new barcode(s) is permitted under the active subscription plan.
 * @param additionalCount Number of new barcodes attempting to be generated (default: 1).
 */
export async function checkBarcodeLimit(additionalCount: number = 1): Promise<BarcodeLimitCheckResult> {
  try {
    const db = await getDB();

    // 1. Check active feature entitlements & tier
    const entRows = await db.select(`
      SELECT feature_key, plan_tier, is_unlocked, expires_at 
      FROM feature_entitlements 
      WHERE is_unlocked = 1
    `) as any[];

    // Filter active and unexpired entitlements
    const activeEntitlements = (entRows || []).filter(row => {
      if (!row.is_unlocked) return false;
      if (row.expires_at) {
        return new Date(row.expires_at).getTime() > Date.now();
      }
      return true;
    });

    // 2. Fetch all subscription plans locally
    let plans: any[] = [];
    try {
      plans = await db.select('SELECT * FROM subscription_plans ORDER BY price_mt ASC') as any[];
    } catch (err) {
      console.warn('[barcodeLimitService] Error reading subscription_plans:', err);
    }

    // 3. Check for any direct shop-level setting override or plan assignments synced from Supabase
    let shopOverrideLimit: number | null = null;
    let shopPlanId: string | null = null;
    let shopPlanTier: string | null = null;

    try {
      const settingRows = await db.select(
        "SELECT key, value FROM settings WHERE key IN ('max_barcodes', 'barcode_limit', 'subscription_plan_id', 'plan_id', 'plan_tier')"
      ) as { key: string; value: string }[];

      for (const r of settingRows || []) {
        if ((r.key === 'max_barcodes' || r.key === 'barcode_limit') && r.value !== undefined && r.value !== null && r.value !== '') {
          const val = parseInt(r.value, 10);
          if (!isNaN(val)) {
            shopOverrideLimit = val;
          }
        } else if (r.key === 'subscription_plan_id' || r.key === 'plan_id') {
          shopPlanId = r.value ? r.value.toLowerCase() : null;
        } else if (r.key === 'plan_tier') {
          shopPlanTier = r.value ? r.value.toLowerCase() : null;
        }
      }
    } catch (e) {
      // ignore
    }

    // Filter active paid entitlements (exclude 'free' tier)
    const activePaidEntitlements = activeEntitlements.filter(e => 
      e.plan_tier && e.plan_tier.toLowerCase() !== 'free'
    );

    const isPaidPlanFromSettings = (
      (shopPlanId && shopPlanId !== 'plan_free' && shopPlanId !== 'free') ||
      (shopPlanTier && shopPlanTier !== 'free')
    );

    let limit: number;

    // Highest Priority: Direct limit override synced from Supabase shop record or plan settings
    if (shopOverrideLimit !== null) {
      limit = shopOverrideLimit;
    } else if (activePaidEntitlements.length > 0 || isPaidPlanFromSettings) {
      const activeTier = (
        activePaidEntitlements[0]?.plan_tier || 
        shopPlanTier || 
        shopPlanId || 
        'pro'
      ).toLowerCase();

      const hasUnlimited = (
        activePaidEntitlements.some(e => 
          e.feature_key === 'unlimited_barcodes' ||
          e.feature_key === 'unlimited_products'
        ) ||
        activeTier === 'enterprise' ||
        activeTier === 'lifetime' ||
        activeTier === 'custom' ||
        activeTier === 'plan_pro_annual' ||
        activeTier === 'annual'
      );

      if (hasUnlimited) {
        const annualPlan = plans.find(p => p.id === 'plan_pro_annual' || p.period === 'annual');
        if (annualPlan && annualPlan.max_barcodes !== undefined && annualPlan.max_barcodes !== null && annualPlan.max_barcodes > 0) {
          limit = Number(annualPlan.max_barcodes);
        } else {
          limit = -1; // Unlimited
        }
      } else {
        const matchedPlan = plans.find(p => 
          p.id?.toLowerCase() === shopPlanId ||
          p.id === activePaidEntitlements[0]?.plan_tier || 
          p.id?.toLowerCase() === activeTier || 
          p.period?.toLowerCase() === activeTier
        );

        if (matchedPlan && matchedPlan.max_barcodes !== undefined && matchedPlan.max_barcodes !== null) {
          limit = Number(matchedPlan.max_barcodes);
        } else {
          const proPlan = plans.find(p => 
            p.id === 'plan_fiados_monthly' || 
            p.id === 'plan_fiados_quarterly' || 
            p.period === 'monthly' || 
            p.period === 'quarterly'
          ) || plans.find(p => p.price_mt > 0 && p.id !== 'plan_pro_annual');

          if (proPlan && proPlan.max_barcodes !== undefined && proPlan.max_barcodes !== null) {
            limit = Number(proPlan.max_barcodes);
          } else {
            limit = 500;
          }
        }
      }
    } else {
      // Default fallback for Free plan without Pro entitlement or Supabase override
      const freePlan = plans.find(p => 
        p.id === 'plan_free' ||
        p.id === 'free' || 
        p.price_mt === 0 || 
        p.name?.toLowerCase().includes('grátis') || 
        p.name?.toLowerCase().includes('free')
      );

      if (freePlan && freePlan.max_barcodes !== undefined && freePlan.max_barcodes !== null) {
        limit = Number(freePlan.max_barcodes);
      } else {
        limit = 50;
      }
    }

    // Count current barcodes
    const countRows = await db.select(
      'SELECT COUNT(*) as total FROM barcodes'
    ) as { total: number }[];
    const current = countRows?.[0]?.total || 0;

    // Unlimited quota
    if (limit === -1) {
      return { allowed: true, limit: -1, current };
    }

    const allowed = (current + additionalCount) <= limit;
    const message = !allowed 
      ? `Atingiu o limite de ${limit} códigos de barras do seu plano (atualmente tem ${current}). Atualize o seu plano para continuar a gerar mais códigos.`
      : undefined;

    return {
      allowed,
      limit,
      current,
      message
    };
  } catch (err) {
    console.error('[barcodeLimitService] checkBarcodeLimit error:', err);
    // Fail-safe open with reasonable default
    return { allowed: true, limit: 50, current: 0 };
  }
}

/**
 * Returns summary statistics of current barcode usage and capacity limit.
 */
export async function getBarcodeUsageSummary(): Promise<BarcodeUsageSummary> {
  try {
    const res = await checkBarcodeLimit(0);
    const isUnlimited = res.limit === -1;
    const isAtLimit = !isUnlimited && res.current >= res.limit;
    const percentage = isUnlimited ? 0 : Math.min(100, Math.round((res.current / res.limit) * 100));
    const remaining = isUnlimited ? Infinity : Math.max(0, res.limit - res.current);

    return {
      current: res.current,
      limit: res.limit,
      remaining,
      isAtLimit,
      isUnlimited,
      percentage
    };
  } catch (e) {
    return {
      current: 0,
      limit: 50,
      remaining: 50,
      isAtLimit: false,
      isUnlimited: false,
      percentage: 0
    };
  }
}
