import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, ShoppingBag, Receipt } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface RevenueCardProps {
  receitaTotal: number;
  salesCount?: number;
  averageTicket?: number;
  lastUpdatedAt?: string;
}

export default function RevenueCard({
  receitaTotal,
  salesCount,
  averageTicket,
  lastUpdatedAt,
}: RevenueCardProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  const formatMoney = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View
      style={[
        tw`rounded-2xl border p-5 mb-3`,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={tw`flex-row items-center justify-between mb-2.5`}>
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`w-7 h-7 rounded-lg bg-[#4F46E5]/15 border border-[#4F46E5]/30 items-center justify-center`}>
            <TrendingUp size={15} color="#6366F1" />
          </View>
          <Text style={[tw`text-[10px] font-bold tracking-wider uppercase`, { color: colors.textSecondary }]}>
            {t('TOTAL REVENUE')}
          </Text>
        </View>
        <View style={tw`flex-row items-center gap-1.5`}>
          <View style={tw`w-2 h-2 rounded-full bg-emerald-500`} />
          <View style={tw`bg-[#10B981]/15 border border-[#10B981]/30 px-2 py-0.5 rounded-full`}>
            <Text style={tw`text-[9px] font-bold text-[#10B981] uppercase`}>{t('TODAY')}</Text>
          </View>
        </View>
      </View>

      <Text style={[tw`text-3xl font-bold font-mono tracking-tight`, { color: colors.text }]}>
        {`MT ${formatMoney(receitaTotal)}`}
      </Text>

      {/* KPI Stats Pill Row (Sales Count & Average Ticket from live_metrics) */}
      {(salesCount !== undefined && salesCount > 0) || (averageTicket !== undefined && averageTicket > 0) ? (
        <View style={[tw`flex-row items-center flex-wrap gap-2 mt-2.5 pt-2.5 border-t`, { borderTopColor: colors.border }]}>
          {salesCount !== undefined && salesCount > 0 ? (
            <View style={tw`flex-row items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md`}>
              <ShoppingBag size={11} color="#6366F1" />
              <Text style={tw`text-[10px] font-bold text-indigo-500`}>
                {salesCount} {salesCount === 1 ? t('sale') : t('sales')}
              </Text>
            </View>
          ) : null}

          {averageTicket !== undefined && averageTicket > 0 ? (
            <View style={tw`flex-row items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md`}>
              <Receipt size={11} color="#10B981" />
              <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>
                {t('Avg Ticket:')}{' '}
                <Text style={tw`font-bold font-mono text-emerald-500`}>
                  {`MT ${formatMoney(averageTicket)}`}
                </Text>
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={[tw`text-[10px] mt-1.5`, { color: colors.textSecondary }]}>
          {t('All completed POS register sales today')}
        </Text>
      )}
    </View>
  );
}
