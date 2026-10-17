import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import tw from 'twrnc';
import { Sparkles, ShieldCheck, ChevronRight, MessageCircle, Calendar, Zap, Layers, Clock, Smartphone } from 'lucide-react-native';
import { supabase } from '../../../supabase';
import { PlanEntitlementInfo } from '../../DeliveriesScreen/types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface CurrentPlanCardProps {
  shopData: {
    id: string;
    name: string;
    code: string;
    companion_app_enabled?: boolean;
    companion_app_expires_at?: string | null;
  };
}

export default function CurrentPlanCard({ shopData }: CurrentPlanCardProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [planInfo, setPlanInfo] = useState<PlanEntitlementInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchPlan() {
      if (!shopData?.id) return;
      try {
        // 1. Try querying feature_entitlements for this shop
        const { data: entitlements, error: entError } = await supabase
          .from('feature_entitlements')
          .select('*')
          .eq('shop_id', shopData.id)
          .limit(1);

        let planTier = 'pro'; // default sensible tier
        let expiresAt: string | null = null;
        let isUnlocked = true;

        if (!entError && entitlements && entitlements.length > 0) {
          planTier = entitlements[0].plan_tier || 'free';
          expiresAt = entitlements[0].expires_at || null;
          isUnlocked = entitlements[0].is_unlocked ?? true;
        }

        // 2. Try querying subscription_plans to get limits and details
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .or(`id.eq.${planTier},name.ilike.%${planTier}%`)
          .limit(1);

        if (!planError && planData && planData.length > 0) {
          const p = planData[0];
          setPlanInfo({
            plan_tier: planTier,
            is_unlocked: isUnlocked,
            expires_at: expiresAt,
            plan_name: p.name,
            max_deliveries: p.max_deliveries ?? 50,
            max_products: p.max_products ?? 50,
            max_fiado_customers: p.max_fiado_customers ?? 20,
            features_included: Array.isArray(p.features_included) ? p.features_included : [],
            price_mt: p.price_mt,
          });
        } else {
          // Default fallback based on detected planTier
          const tierUpper = planTier.toUpperCase();
          setPlanInfo({
            plan_tier: planTier,
            is_unlocked: isUnlocked,
            expires_at: expiresAt,
            plan_name: `${tierUpper} Plan`,
            max_deliveries: planTier === 'pro' ? 50 : 20,
            max_products: planTier === 'pro' ? 100 : 30,
            max_fiado_customers: planTier === 'pro' ? 50 : 15,
            features_included: ['Real-Time Sales', 'Expected Deliveries', 'Fiado Ledger', 'Cash Drawer Audit'],
          });
        }
      } catch (e) {
        console.warn('Error fetching plan entitlement:', e);
        setPlanInfo({
          plan_tier: 'pro',
          is_unlocked: true,
          expires_at: null,
          plan_name: 'Pro Plan',
          max_deliveries: 50,
          max_products: 50,
          max_fiado_customers: 20,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [shopData?.id]);

  if (loading) {
    return (
      <View style={tw`bg-[#18181B] rounded-2xl border border-[#27272A] p-4 mb-4 items-center justify-center`}>
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  const tier = planInfo?.plan_tier?.toUpperCase() || 'PRO';
  const isProOrPremium = tier.includes('PRO') || tier.includes('PREMIUM') || tier.includes('ENTERPRISE');

  // Helper to calculate days countdown
  const getCountdown = (targetDate: string | null | undefined, defaultDays: number = 30) => {
    if (!targetDate) {
      return {
        days: defaultDays,
        label: `${defaultDays} ${t('days left')}`,
        isExpired: false,
        isWarning: false,
      };
    }
    const diffMs = new Date(targetDate).getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      return {
        days: 0,
        label: t('Expired'),
        isExpired: true,
        isWarning: true,
      };
    }
    return {
      days,
      label: days === 1 ? `1 ${t('day left')}` : `${days} ${t('days left')}`,
      isExpired: false,
      isWarning: days <= 5,
    };
  };

  const planCountdown = getCountdown(planInfo?.expires_at, 28);
  const companionCountdown = getCountdown(shopData?.companion_app_expires_at, 30);

  // Helper to format quotas (avoid negative numbers like -1 / mo)
  const formatQuota = (val: number | null | undefined, unitKey: string) => {
    if (val === undefined || val === null || val <= 0) {
      return t('Unlimited');
    }
    return `${val} ${t(unitKey)}`;
  };

  const handleContactWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello Aura Command Central, I would like to manage/upgrade my subscription for shop: ${shopData.name} (${shopData.code}).`
    );
    Linking.openURL(`https://wa.me/258841234567?text=${text}`).catch(() => {});
  };

  const planDisplayName = planInfo?.plan_name ? t(planInfo.plan_name) : `${tier} ${t('Plan:')}`.replace(':', '');

  return (
    <View
      style={[
        tw`rounded-2xl border p-4 mb-4`,
        {
          backgroundColor: colors.card,
          borderColor: isProOrPremium
            ? isDark
              ? 'rgba(99, 102, 241, 0.3)'
              : 'rgba(99, 102, 241, 0.4)'
            : colors.border,
        },
      ]}
    >
      {/* Top Title & Status */}
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center gap-2.5 flex-1 mr-2`}>
          <View
            style={[
              tw`w-9 h-9 rounded-xl items-center justify-center`,
              isProOrPremium
                ? tw`bg-indigo-500/20 border border-indigo-500/30`
                : { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
            ]}
          >
            <Sparkles size={18} color={isProOrPremium ? '#818CF8' : colors.textSecondary} />
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center gap-1.5 flex-wrap`}>
              <Text style={[tw`font-bold text-sm tracking-tight`, { color: colors.text }]}>
                {planDisplayName}
              </Text>
              <View
                style={[
                  tw`px-2 py-0.5 rounded-full`,
                  isProOrPremium
                    ? tw`bg-indigo-500/20 border border-indigo-500/30`
                    : { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
                ]}
              >
                <Text
                  style={[
                    tw`text-[9px] font-bold uppercase tracking-wider`,
                    isProOrPremium ? tw`text-indigo-400` : { color: colors.textSecondary },
                  ]}
                >
                  {tier}
                </Text>
              </View>
            </View>

            {/* Plan Countdown Days Indicator */}
            <View style={tw`flex-row items-center gap-1 mt-1`}>
              <Clock size={11} color={planCountdown.isWarning ? '#F59E0B' : '#818CF8'} />
              <Text
                style={[
                  tw`text-[11px] font-medium font-mono`,
                  planCountdown.isWarning ? tw`text-amber-500` : { color: colors.textSecondary },
                ]}
              >
                {t('Plan:')} {planCountdown.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Pill */}
        <View style={tw`flex-row items-center gap-1 ${planCountdown.isExpired ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'} px-2.5 py-1 rounded-full`}>
          <View style={tw`w-1.5 h-1.5 rounded-full ${planCountdown.isExpired ? 'bg-red-400' : 'bg-emerald-400'}`} />
          <Text style={tw`${planCountdown.isExpired ? 'text-red-400' : 'text-emerald-400'} text-[10px] font-bold uppercase tracking-wider`}>
            {planCountdown.isExpired ? t('Expired') : t('Active')}
          </Text>
        </View>
      </View>

      {/* Companion App Countdown Bar */}
      <View
        style={[
          tw`mt-3 px-3 py-2 rounded-xl border flex-row items-center justify-between`,
          {
            backgroundColor: isDark ? '#121215' : '#F4F4F5',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={tw`flex-row items-center gap-2`}>
          <Smartphone size={13} color="#10B981" />
          <Text style={[tw`text-xs font-semibold`, { color: colors.text }]}>
            {t('Companion App Access')}
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg`}>
          <Calendar size={10} color="#34D399" />
          <Text style={tw`text-emerald-500 font-bold font-mono text-[10px]`}>
            {companionCountdown.label}
          </Text>
        </View>
      </View>

      {/* Quotas / Limits Grid */}
      <View
        style={[
          tw`flex-row items-center justify-between mt-3 pt-3 border-t gap-2`,
          { borderTopColor: colors.border },
        ]}
      >
        <View
          style={[
            tw`flex-1 p-2.5 rounded-xl border`,
            {
              backgroundColor: isDark ? '#121215' : '#F4F4F5',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[tw`text-[9px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
            {t('Deliveries')}
          </Text>
          <Text style={[tw`font-bold text-xs mt-0.5`, { color: colors.text }]}>
            {formatQuota(planInfo?.max_deliveries, '/ mo')}
          </Text>
        </View>

        <View
          style={[
            tw`flex-1 p-2.5 rounded-xl border`,
            {
              backgroundColor: isDark ? '#121215' : '#F4F4F5',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[tw`text-[9px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
            {t('Products')}
          </Text>
          <Text style={[tw`font-bold text-xs mt-0.5`, { color: colors.text }]}>
            {formatQuota(planInfo?.max_products, 'max')}
          </Text>
        </View>

        <View
          style={[
            tw`flex-1 p-2.5 rounded-xl border`,
            {
              backgroundColor: isDark ? '#121215' : '#F4F4F5',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[tw`text-[9px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
            {t('Fiado Credit')}
          </Text>
          <Text style={[tw`font-bold text-xs mt-0.5`, { color: colors.text }]}>
            {formatQuota(planInfo?.max_fiado_customers, 'clients')}
          </Text>
        </View>
      </View>

      {/* Expandable details or upgrade */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={tw`flex-row items-center justify-between mt-3 pt-2`}
      >
        <View style={tw`flex-row items-center gap-1.5`}>
          <Layers size={12} color="#818CF8" />
          <Text style={tw`text-indigo-400 text-xs font-semibold`}>
            {expanded ? t('Hide Plan Features') : t('View Plan Entitlements & Features')}
          </Text>
        </View>
        <ChevronRight size={13} color="#818CF8" style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
      </TouchableOpacity>

      {expanded ? (
        <View
          style={[
            tw`mt-2 pt-2.5 border-t`,
            { borderTopColor: colors.border },
          ]}
        >
          <Text style={[tw`text-[10px] font-bold uppercase tracking-wider mb-2`, { color: colors.textSecondary }]}>
            {t('Entitlements Included:')}
          </Text>
          <View style={tw`flex-row flex-wrap gap-1.5 mb-3`}>
            {(planInfo?.features_included && planInfo.features_included.length > 0
              ? planInfo.features_included
              : ['Real-Time Sales Audit', 'Expected Deliveries Tracking', 'Remote Authorization', 'Fiado Debt Ledger', 'Emergency Tokens']
            ).map((feat, i) => (
              <View
                key={i}
                style={[
                  tw`px-2.5 py-1 rounded-lg border`,
                  {
                    backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[tw`text-[10px] font-medium`, { color: colors.text }]}>
                  ✓ {t(feat)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              tw`py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5 border`,
              {
                backgroundColor: isDark ? '#27272A' : '#F4F4F5',
                borderColor: colors.border,
              },
            ]}
            onPress={handleContactWhatsApp}
          >
            <MessageCircle size={13} color="#25D366" />
            <Text style={[tw`text-xs font-semibold`, { color: colors.text }]}>
              {t('Manage Plan on Command Central')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
