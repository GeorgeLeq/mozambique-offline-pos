import React from 'react';
import { View, Text } from 'react-native';
import { Wallet } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface DrawerCashCardProps {
  dinheiroEmCaixa: number;
  baseCash: number;
  dinheiroVivo: number;
  totalPayouts: number;
}

export default function DrawerCashCard({
  dinheiroEmCaixa,
  baseCash,
  dinheiroVivo,
  totalPayouts,
}: DrawerCashCardProps) {
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
        tw`rounded-2xl border border-[#10B981]/30 p-5 mb-4`,
        { backgroundColor: colors.card },
      ]}
    >
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`w-7 h-7 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 items-center justify-center`}>
            <Wallet size={15} color="#10B981" />
          </View>
          <Text style={tw`text-[10px] font-bold text-[#10B981] tracking-wider uppercase`}>
            {t('CASH IN DRAWER')}
          </Text>
        </View>
        <View style={tw`bg-[#10B981]/15 border border-[#10B981]/30 px-2 py-0.5 rounded-full`}>
          <Text style={tw`text-[8px] font-bold text-[#10B981] uppercase`}>
            {t('EXPECTED IN DRAWER')}
          </Text>
        </View>
      </View>

      <Text style={[tw`text-4xl font-bold font-mono mb-4 tracking-tight`, { color: colors.text }]}>
        {`MT ${formatMoney(dinheiroEmCaixa)}`}
      </Text>

      <View style={[tw`border-t pt-3`, { borderTopColor: colors.border }]}>
        <View style={tw`flex-row justify-between items-center mb-1.5`}>
          <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>{t('+ Base Cash Float')}</Text>
          <Text style={[tw`text-[10px] font-mono`, { color: colors.text }]}>{`MT ${formatMoney(baseCash)}`}</Text>
        </View>
        <View style={tw`flex-row justify-between items-center mb-1.5`}>
          <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>{t('+ Cash Sales')}</Text>
          <Text style={tw`text-[10px] text-[#10B981] font-mono font-bold`}>{`MT ${formatMoney(dinheiroVivo)}`}</Text>
        </View>
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>{t('- Till Payouts')}</Text>
          <Text style={tw`text-[10px] text-red-500 font-mono font-bold`}>{`MT ${formatMoney(totalPayouts)}`}</Text>
        </View>
      </View>
    </View>
  );
}

