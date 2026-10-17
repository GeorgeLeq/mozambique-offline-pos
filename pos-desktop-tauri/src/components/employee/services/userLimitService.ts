/**
 * @file userLimitService.ts
 * @description Offline-first operator and user quota enforcement.
 * Restricts user creation based on the active subscription tier (Free: 3, Pro: 10, Enterprise: Unlimited),
 * while supporting dynamic overrides set remotely by Command Central.
 */

import { getDB } from '../../../lib/db';
import { loadEntitlementsFromDb, loadPlansFromDb, DEFAULT_PLANS } from '../../../subscription/subscriptionDb';

export interface UserLimitCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  message?: string;
}

export interface UserUsageSummary {
  current: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
  isUnlimited: boolean;
  percentage: number;
}

/**
 * Checks if registering new operator/user(s) is permitted under the active subscription plan.
 * @param additionalCount Number of new users attempting to be added (default: 1).
 */
export async function checkUserLimit(additionalCount: number = 1): Promise<UserLimitCheckResult> {
  try {
    const db = await getDB();

    // 1. Proactively ensure is_deleted column exists on users table (idempotent migration fallback)
    try {
      await db.execute("ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0;");
    } catch {}

    // 2. Fetch all feature entitlements locally with expiration validation
    let activeEntitlementsList: any[] = [];
    try {
      const entitlementsMap = await loadEntitlementsFromDb();
      activeEntitlementsList = Object.values(entitlementsMap).filter(e => e.is_unlocked);
    } catch (e) {
      console.warn('[userLimitService] Error loading entitlements:', e);
      try {
        const entRows = await db.select('SELECT * FROM feature_entitlements') as any[];
        activeEntitlementsList = (entRows || []).filter(row => {
          const isUnlocked = row.is_unlocked === 1 || row.is_unlocked === true || row.is_unlocked === '1';
          if (!isUnlocked) return false;
          if (row.expires_at) {
            return new Date(row.expires_at).getTime() > Date.now();
          }
          return true;
        });
      } catch {}
    }

    // 3. Fetch subscription plans locally with fallback to defaults
    let plans = DEFAULT_PLANS;
    try {
      const loadedPlans = await loadPlansFromDb();
      if (loadedPlans && loadedPlans.length > 0) {
        plans = loadedPlans;
      }
    } catch (err) {
      console.warn('[userLimitService] Error reading subscription_plans:', err);
    }

    // 4. Check settings table for tier or direct limits
    let shopTier: string | null = null;
    let shopPlanId: string | null = null;
    let shopOverrideLimit: number | null = null;

    try {
      const settingRows = await db.select(
        "SELECT key, value FROM settings WHERE key IN ('subscription_tier', 'plan_tier', 'plan_id', 'subscription_plan_id', 'max_users', 'user_limit')"
      ) as { key: string; value: string }[];
      
      settingRows?.forEach(r => {
        const k = r.key?.toLowerCase();
        const v = r.value?.toLowerCase();
        if (k === 'subscription_tier' || k === 'plan_tier') {
          shopTier = v;
        }
        if (k === 'plan_id' || k === 'subscription_plan_id') {
          shopPlanId = v;
        }
        if (k === 'max_users' || k === 'user_limit') {
          const val = parseInt(r.value, 10);
          if (!isNaN(val) && (val > 0 || val === -1)) shopOverrideLimit = val;
        }
      });
    } catch (e) {
      // ignore
    }

    // 5. Determine if Pro / Unlimited is active
    const hasUnlimitedFeature = activeEntitlementsList.some(e => 
      e.feature_key === 'unlimited_users' ||
      e.plan_tier?.toLowerCase() === 'enterprise' ||
      e.plan_tier?.toLowerCase() === 'lifetime' ||
      e.plan_tier?.toLowerCase() === 'plan_pro_annual' ||
      e.plan_tier?.toLowerCase() === 'annual'
    );

    const isAnnualOrUnlimitedPlan = 
      hasUnlimitedFeature ||
      shopTier === 'enterprise' || 
      shopTier === 'annual' || 
      shopTier === 'lifetime' ||
      shopPlanId === 'plan_pro_annual' ||
      (shopPlanId && shopPlanId.includes('annual'));

    const hasProEntitlement = activeEntitlementsList.some(e => 
      (e.plan_tier?.toLowerCase() === 'pro' ||
       e.plan_tier?.toLowerCase() === 'enterprise' ||
       e.plan_tier?.toLowerCase() === 'annual') ||
      (e.feature_key === 'client_debts' && e.plan_tier?.toLowerCase() === 'pro') ||
      e.feature_key === 'advanced_audits' ||
      e.feature_key === 'custom_permissions' ||
      e.feature_key === 'cloud_backup' ||
      e.feature_key === 'unlimited_users'
    );

    const isProTier = 
      hasProEntitlement || 
      shopTier === 'pro' || 
      shopTier === 'plan_pro' ||
      shopPlanId === 'plan_fiados_monthly' ||
      shopPlanId === 'plan_fiados_quarterly' ||
      shopPlanId === 'plan_audits_monthly' ||
      (shopPlanId && shopPlanId.includes('fiados')) ||
      (shopPlanId && shopPlanId.includes('audits')) ||
      isAnnualOrUnlimitedPlan;

    let limit = 3; // Default Free Plan limit

    if (shopOverrideLimit !== null) {
      // Direct override (e.g. from Command Central shop quota)
      limit = shopOverrideLimit;
    } else if (isAnnualOrUnlimitedPlan) {
      const annualPlan = plans.find(p => p.id === 'plan_pro_annual' || p.period === 'annual');
      if (annualPlan && annualPlan.max_users !== undefined && annualPlan.max_users > 0) {
        limit = Number(annualPlan.max_users);
      } else {
        limit = -1; // Unlimited
      }
    } else if (isProTier) {
      // Pro Plan limit (default: 10 operators)
      const proPlan = plans.find(p => 
        p.id === shopPlanId ||
        p.id === 'plan_fiados_monthly' || 
        p.id === 'plan_fiados_quarterly' || 
        p.period === 'monthly' || 
        p.period === 'quarterly'
      ) || plans.find(p => p.price_mt > 0 && p.id !== 'plan_pro_annual');

      if (proPlan && proPlan.max_users !== undefined && proPlan.max_users !== null && Number(proPlan.max_users) > 0) {
        limit = Number(proPlan.max_users);
      } else {
        limit = 10;
      }
    } else {
      // Free Plan limit (3 operators)
      const freePlan = plans.find(p => 
        p.id === 'free' || 
        p.id === 'plan_free' || 
        p.price_mt === 0 || 
        p.name?.toLowerCase().includes('grátis') || 
        p.name?.toLowerCase().includes('free')
      );

      if (freePlan && freePlan.max_users !== undefined && freePlan.max_users !== null && Number(freePlan.max_users) > 0) {
        limit = Number(freePlan.max_users);
      } else {
        limit = 3;
      }
    }

    // 6. Count current active users safely (excluding soft-deleted users in recycle bin)
    // Avoids "no such column: is_deleted" by selecting users and filtering in JS
    let current = 0;
    try {
      const usersList = await db.select('SELECT * FROM users') as any[];
      if (Array.isArray(usersList)) {
        current = usersList.filter(u => !u.is_deleted || u.is_deleted === 0 || u.is_deleted === '0').length;
      }
    } catch (countErr) {
      try {
        const countRows = await db.select('SELECT COUNT(*) as total FROM users') as { total: number }[];
        current = countRows?.[0]?.total || 0;
      } catch {
        current = 0;
      }
    }

    // Unlimited quota
    if (limit === -1) {
      return { allowed: true, limit: -1, current };
    }

    const allowed = (current + additionalCount) <= limit;
    const message = !allowed 
      ? `Atingiu o limite de ${limit} operadores do seu plano (atualmente tem ${current} registados). Atualize o seu plano para adicionar mais colaboradores.`
      : undefined;

    return {
      allowed,
      limit,
      current,
      message
    };
  } catch (err) {
    console.error('[userLimitService] checkUserLimit error:', err);
    return { allowed: true, limit: 3, current: 0 };
  }
}

/**
 * Returns summary statistics of current operator count and subscription limit.
 */
export async function getUserUsageSummary(): Promise<UserUsageSummary> {
  try {
    const res = await checkUserLimit(0);
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
      limit: 3,
      remaining: 3,
      isAtLimit: false,
      isUnlimited: false,
      percentage: 0
    };
  }
}
