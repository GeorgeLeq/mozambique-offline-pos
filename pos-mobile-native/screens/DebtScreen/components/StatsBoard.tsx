import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface StatsBoardProps {
  totalOriginal: number;
  totalOutstanding: number;
  totalCollected: number;
  totalDebtors: number;
}

export default function StatsBoard({
  totalOriginal,
  totalOutstanding,
  totalCollected,
  totalDebtors,
}: StatsBoardProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={tw`px-4 mt-3 gap-2.5`}>
      {/* Top summary row */}
      <View
        style={[
          tw`rounded-2xl p-3 flex-row justify-between items-center border`,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[tw`text-[10px] font-bold uppercase tracking-wider`, { color: colors.textSecondary }]}>
          {t('Debtors Profile')}
        </Text>
        <Text style={tw`text-[10px] text-[#6366F1] font-mono font-bold`}>
          {`${totalDebtors} ${t('active debtors')}`}
        </Text>
      </View>

      <View style={tw`flex-row gap-2.5`}>
        <View
          style={[
            tw`flex-1 p-3 rounded-2xl border`,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[tw`text-[8px] font-bold tracking-wider uppercase`, { color: colors.textSecondary }]}>
            {t('TOTAL DEBT')}
          </Text>
          <Text
            style={[tw`text-[13px] font-bold mt-1 font-mono`, { color: colors.text }]}
            numberOfLines={1}
          >
            {totalOriginal.toLocaleString()} MT
          </Text>
        </View>

        <View
          style={[
            tw`flex-1 p-3 rounded-2xl border`,
            {
              backgroundColor: isDark ? colors.card : 'rgba(245, 158, 11, 0.06)',
              borderColor: 'rgba(245, 158, 11, 0.35)',
            },
          ]}
        >
          <Text style={tw`text-[8px] text-amber-500 font-bold tracking-wider uppercase`}>
            {t('PENDING (FIADO)')}
          </Text>
          <Text style={tw`text-[13px] text-amber-500 font-bold mt-1 font-mono`} numberOfLines={1}>
            {totalOutstanding.toLocaleString()} MT
          </Text>
        </View>

        <View
          style={[
            tw`flex-1 p-3 rounded-2xl border`,
            {
              backgroundColor: isDark ? colors.card : 'rgba(16, 185, 129, 0.06)',
              borderColor: 'rgba(16, 185, 129, 0.35)',
            },
          ]}
        >
          <Text style={tw`text-[8px] text-emerald-500 font-bold tracking-wider uppercase`}>
            {t('COLLECTED')}
          </Text>
          <Text style={tw`text-[13px] text-[#10B981] font-bold mt-1 font-mono`} numberOfLines={1}>
            {totalCollected.toLocaleString()} MT
          </Text>
        </View>
      </View>
    </View>
  );
}

