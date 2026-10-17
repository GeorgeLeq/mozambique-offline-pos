import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { ArrowLeft, History, MapPin, Phone, CreditCard, CheckCircle2 } from 'lucide-react-native';
import tw from 'twrnc';
import { Debt, DebtPayment } from './types';
import { useLanguage } from '../../locales';
import { useTheme } from '../../theme';

interface DebtDetailsScreenProps {
  debt: Debt;
  payments: DebtPayment[];
  onBack: () => void;
}

function formatItemsList(itemsJson: string | undefined): any[] {
  if (!itemsJson) return [];
  try {
    const parsed = JSON.parse(itemsJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          const name = item.name || item.product_name || item.title || 'Item';
          const qty = item.quantity || item.qty || 1;
          const price = item.price || item.unit_price || 0;
          return { name, qty, price };
        }
        return { name: String(item), qty: 1, price: 0 };
      });
    } else if (typeof parsed === 'object' && parsed !== null) {
      const name = parsed.name || parsed.product_name || parsed.title;
      const qty = parsed.quantity || parsed.qty || 1;
      const price = parsed.price || parsed.unit_price || 0;
      if (name) {
        return [{ name, qty, price }];
      }
    }
    return [{ name: String(parsed), qty: 1, price: 0 }];
  } catch (e) {
    return [{ name: itemsJson, qty: 1, price: 0 }];
  }
}

export default function DebtDetailsScreen({ debt, payments, onBack }: DebtDetailsScreenProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const items = formatItemsList(debt.items_json);
  const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount_mt), 0);
  const remaining = debt.status === 'paid' ? 0 : Math.max(0, Number(debt.amount_mt) - paidAmount);

  const displayStatus = debt.status === 'paid' || remaining <= 0
    ? 'PAID'
    : paidAmount > 0
    ? 'PARTIAL'
    : 'UNPAID';

  const statusLabel =
    displayStatus === 'PAID'
      ? t('PAID')
      : displayStatus === 'PARTIAL'
      ? t('PARTIAL')
      : t('UNPAID');

  const statusColor =
    displayStatus === 'PAID'
      ? 'text-emerald-500'
      : displayStatus === 'PARTIAL'
      ? 'text-amber-500'
      : 'text-red-500';
  
  const statusBg =
    displayStatus === 'PAID'
      ? 'bg-emerald-500/10'
      : displayStatus === 'PARTIAL'
      ? 'bg-amber-500/10'
      : 'bg-red-500/10';

  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[tw`flex-1`, { backgroundColor: colors.bg, opacity: fadeAnim }]}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center gap-4 px-4 py-4 border-b`,
          { backgroundColor: colors.bg, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={[
            tw`p-2 rounded-full`,
            { backgroundColor: isDark ? '#18181B' : '#E4E4E7' },
          ]}
        >
          <ArrowLeft size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={[tw`text-sm font-semibold`, { color: colors.text }]}>{t('Debt Details')}</Text>
          <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>{debt.customer_name}</Text>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-12`}>
        {/* Top Overview Card */}
        <View
          style={[
            tw`border rounded-2xl p-4 mb-4`,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={tw`flex-row justify-between items-start mb-4`}>
            <View>
              <Text style={[tw`text-lg font-bold`, { color: colors.text }]}>{debt.customer_name}</Text>
              <Text style={[tw`text-[11px]`, { color: colors.textSecondary }]}>
                {`${t('Added on')} ${new Date(debt.created_at).toLocaleDateString()}`}
              </Text>
            </View>
            <View style={tw`px-2 py-1 rounded ${statusBg}`}>
              <Text style={tw`text-[10px] font-extrabold uppercase ${statusColor} tracking-wider`}>
                {statusLabel}
              </Text>
            </View>
          </View>

          {!!(debt.phone_number || debt.address) && (
            <View
              style={[
                tw`gap-2 mt-2 p-3 rounded-xl border`,
                {
                  backgroundColor: isDark ? '#09090B' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
            >
              {debt.phone_number ? (
                <View style={tw`flex-row items-center gap-2`}>
                  <Phone size={12} color={colors.textSecondary} />
                  <Text style={[tw`text-xs font-mono`, { color: colors.text }]}>{debt.phone_number}</Text>
                </View>
              ) : null}
              {debt.address ? (
                <View style={tw`flex-row items-center gap-2`}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={[tw`text-xs`, { color: colors.text }]}>{debt.address}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={[tw`flex-row justify-between items-center mt-5 pt-4 border-t`, { borderTopColor: colors.border }]}>
            <View>
              <Text style={[tw`text-[9px] font-extrabold uppercase tracking-wider`, { color: colors.textSecondary }]}>{t('Total Amount')}</Text>
              <Text style={[tw`text-base font-mono mt-0.5`, { color: colors.text }]}>MT {Number(debt.amount_mt).toLocaleString()}</Text>
            </View>
            <View style={tw`items-end`}>
              <Text style={[tw`text-[9px] font-extrabold uppercase tracking-wider`, { color: colors.textSecondary }]}>{t('Outstanding')}</Text>
              <Text style={tw`text-base text-red-500 font-mono mt-0.5`}>MT {remaining.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Detailed Items Section */}
        <Text style={[tw`text-[11px] font-extrabold uppercase tracking-widest mb-3 mt-2 px-1`, { color: colors.textSecondary }]}>
          {t('Items Purchased')}
        </Text>
        <View
          style={[
            tw`border rounded-2xl p-4 mb-6 gap-3`,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {items.length > 0 ? (
            items.map((item, idx) => (
              <View
                key={idx}
                style={[
                  tw`flex-row justify-between items-center`,
                  idx > 0 ? [tw`border-t pt-3`, { borderTopColor: colors.border }] : {},
                ]}
              >
                <View style={tw`flex-row items-center gap-3`}>
                  <View
                    style={[
                      tw`h-8 w-8 rounded-full items-center justify-center`,
                      { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
                    ]}
                  >
                    <Text style={[tw`text-xs font-mono font-bold`, { color: colors.textSecondary }]}>{item.qty}x</Text>
                  </View>
                  <Text style={[tw`text-sm`, { color: colors.text }]}>{item.name}</Text>
                </View>
                {item.price ? (
                  <Text style={[tw`text-xs font-mono`, { color: colors.textSecondary }]}>MT {item.price.toLocaleString()}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={[tw`text-xs italic text-center py-2`, { color: colors.textSecondary }]}>{t('No item details available')}</Text>
          )}
        </View>

        {/* Payment History Section */}
        <Text style={[tw`text-[11px] font-extrabold uppercase tracking-widest mb-3 px-1`, { color: colors.textSecondary }]}>
          {t('Payment History')}
        </Text>
        <View
          style={[
            tw`border rounded-2xl p-4`,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {payments.length > 0 ? (
            payments.map((p, idx) => (
              <View
                key={p.id}
                style={[
                  tw`flex-row items-start gap-4`,
                  idx > 0 ? [tw`border-t pt-4 mt-4`, { borderTopColor: colors.border }] : {},
                ]}
              >
                <View style={tw`bg-emerald-500/10 h-8 w-8 rounded-full items-center justify-center mt-0.5`}>
                  <CheckCircle2 size={14} color="#10B981" />
                </View>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row justify-between items-center mb-1`}>
                    <Text style={tw`text-emerald-500 font-bold font-mono text-sm`}>
                      + MT {Number(p.amount_mt).toLocaleString()}
                    </Text>
                    <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center justify-between`}>
                    <Text style={[tw`text-[11px] capitalize`, { color: colors.textSecondary }]}>{p.payment_method}</Text>
                    {!!p.cashier_name && (
                      <Text style={[tw`text-[9px] font-mono`, { color: colors.textMuted }]}>{`${t('by')} ${p.cashier_name}`}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={[tw`text-xs italic text-center py-4`, { color: colors.textSecondary }]}>{t('No payments recorded yet')}</Text>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}
