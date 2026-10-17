import React from 'react';
import { View, Text } from 'react-native';
import { DollarSign, Smartphone, CreditCard } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface PaymentBreakdownCardsProps {
  dinheiroVivo: number;
  mpesa: number;
  emola: number;
  cardSales?: number;
  otherSales?: number;
}

export default function PaymentBreakdownCards({
  dinheiroVivo,
  mpesa,
  emola,
  cardSales = 0,
  otherSales = 0,
}: PaymentBreakdownCardsProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  const formatMoney = (val: number) => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const cardStyle = [
    tw`flex-1 rounded-2xl border p-4`,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
  ];

  const digitalTotal = mpesa + emola + cardSales + otherSales;

  return (
    <>
      <View style={tw`flex-row gap-3 mb-3`}>
        {/* Card B: Dinheiro Vivo / Cash */}
        <View style={cardStyle}>
          <View style={tw`flex-row items-center gap-1.5 mb-2`}>
            <View style={tw`w-5 h-5 rounded-md bg-[#10B981]/15 items-center justify-center`}>
              <DollarSign size={12} color="#10B981" />
            </View>
            <Text style={[tw`text-[9px] font-bold tracking-wider uppercase`, { color: colors.textSecondary }]}>
              {t('CASH')}
            </Text>
          </View>
          <Text style={[tw`text-lg font-bold font-mono`, { color: colors.text }]}>
            {`MT ${formatMoney(dinheiroVivo)}`}
          </Text>
          <Text style={tw`text-[8px] text-emerald-500 font-medium mt-1`}>{t('Cash in hand')}</Text>
        </View>

        {/* Card C: M-Pesa */}
        <View style={cardStyle}>
          <View style={tw`flex-row items-center gap-1.5 mb-2`}>
            <View style={tw`w-5 h-5 rounded-md bg-[#DC2626]/15 items-center justify-center`}>
              <Smartphone size={12} color="#DC2626" />
            </View>
            <Text style={[tw`text-[9px] font-bold tracking-wider uppercase`, { color: colors.textSecondary }]}>
              M-PESA
            </Text>
          </View>
          <Text style={[tw`text-lg font-bold font-mono`, { color: colors.text }]}>
            {`MT ${formatMoney(mpesa)}`}
          </Text>
          <Text style={tw`text-[8px] text-red-500 font-medium mt-1`}>Vodacom Pay</Text>
        </View>
      </View>

      <View style={tw`flex-row gap-3 mb-3`}>
        {/* Card D: e-Mola */}
        <View style={cardStyle}>
          <View style={tw`flex-row items-center gap-1.5 mb-2`}>
            <View style={tw`w-5 h-5 rounded-md bg-[#F59E0B]/15 items-center justify-center`}>
              <CreditCard size={12} color="#F59E0B" />
            </View>
            <Text style={[tw`text-[9px] font-bold tracking-wider uppercase`, { color: colors.textSecondary }]}>
              E-MOLA
            </Text>
          </View>
          <Text style={[tw`text-lg font-bold font-mono`, { color: colors.text }]}>
            {`MT ${formatMoney(emola)}`}
          </Text>
          <Text style={tw`text-[8px] text-amber-500 font-medium mt-1`}>Movitel Pay</Text>
        </View>

        {/* Card E: Total Electronic & Digital */}
        <View style={cardStyle}>
          <View style={tw`flex-row items-center gap-1.5 mb-2`}>
            <View style={tw`w-5 h-5 rounded-md bg-[#4F46E5]/15 items-center justify-center`}>
              <CreditCard size={12} color="#6366F1" />
            </View>
            <Text style={[tw`text-[9px] font-bold tracking-wider uppercase`, { color: colors.textSecondary }]}>
              {t('DIGITAL TOTAL')}
            </Text>
          </View>
          <Text style={tw`text-lg font-bold text-[#6366F1] font-mono`}>
            {`MT ${formatMoney(digitalTotal)}`}
          </Text>
          <Text style={[tw`text-[8px] mt-1`, { color: colors.textSecondary }]}>
            {cardSales > 0 ? `${t('Mobile')} & POS Cards` : t('Mobile electronic total')}
          </Text>
        </View>
      </View>
    </>
  );
}
