import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking } from 'react-native';
import { Phone, MapPin, CheckCircle2, CreditCard, Edit2, Trash2, ChevronDown, ChevronUp, History, Eye, MessageCircle } from 'lucide-react-native';
import tw from 'twrnc';
import { Debt } from '../types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface DebtCardProps {
  debt: Debt;
  paid: number;
  remaining: number;
  payments?: any[];
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
}

function formatItems(itemsJson: string | undefined): string {
  if (!itemsJson) return '';
  try {
    const parsed = JSON.parse(itemsJson);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const name = item.name || item.product_name || item.title || 'Item';
            const qty = item.quantity || item.qty || 1;
            return `${qty}x ${name}`;
          }
          return String(item);
        })
        .join(', ');
    } else if (typeof parsed === 'object' && parsed !== null) {
      const name = parsed.name || parsed.product_name || parsed.title;
      const qty = parsed.quantity || parsed.qty || 1;
      if (name) {
        return `${qty}x ${name}`;
      }
    }
    return String(parsed);
  } catch (e) {
    return itemsJson;
  }
}

export default function DebtCard({
  debt,
  paid,
  remaining,
  payments = [],
  onPay,
  onEdit,
  onDelete,
  onViewDetails,
}: DebtCardProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const [showHistory, setShowHistory] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const displayStatus = debt.status === 'paid' || remaining <= 0
    ? 'PAID'
    : paid > 0
    ? 'PARTIAL'
    : 'UNPAID';

  const statusLabel =
    displayStatus === 'PAID'
      ? t('PAID')
      : displayStatus === 'PARTIAL'
      ? t('PARTIAL')
      : t('UNPAID');

  return (
    <Animated.View
      style={[
        tw`border rounded-2xl p-4 mb-3`,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Customer Core details */}
      <View style={tw`flex-row justify-between items-start`}>
        <View style={tw`flex-1 pr-2`}>
          <Text style={[tw`text-base font-bold`, { color: colors.text }]}>{debt.customer_name}</Text>
          {debt.phone_number ? (
            <View style={tw`flex-row items-center gap-1.5 mt-1`}>
              <Phone size={11} color={colors.textSecondary} />
              <Text style={[tw`text-[10px] font-mono`, { color: colors.textSecondary }]}>{debt.phone_number}</Text>
            </View>
          ) : null}
          {debt.address ? (
            <View style={tw`flex-row items-center gap-1.5 mt-1`}>
              <MapPin size={11} color={colors.textSecondary} />
              <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>{debt.address}</Text>
            </View>
          ) : null}
        </View>

        <View style={tw`flex-row items-center gap-2`}>
          <View
            style={tw`px-2.5 py-1 rounded-full border ${
              displayStatus === 'PAID'
                ? 'bg-[#10B981]/15 border-[#10B981]/30'
                : displayStatus === 'PARTIAL'
                ? 'bg-amber-500/15 border-amber-500/30'
                : 'bg-red-500/15 border-red-500/30'
            }`}
          >
            <Text
              style={tw`text-[8px] font-bold uppercase tracking-wider ${
                displayStatus === 'PAID'
                  ? 'text-[#10B981]'
                  : displayStatus === 'PARTIAL'
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={[tw`h-[1px] my-3`, { backgroundColor: colors.border }]} />

      <View style={tw`flex-row justify-between`}>
        <View style={tw`flex-1`}>
          <Text style={[tw`text-[8px] font-bold uppercase tracking-wider`, { color: colors.textSecondary }]}>{t('Total Debt')}</Text>
          <Text style={[tw`text-[13px] font-bold font-mono mt-1`, { color: colors.text }]}>MT {debt.amount_mt}</Text>
        </View>
        <View style={tw`flex-1`}>
          <Text style={[tw`text-[8px] font-bold uppercase tracking-wider`, { color: colors.textSecondary }]}>{t('Paid')}</Text>
          <Text style={tw`text-[13px] text-[#10B981] font-bold font-mono mt-1`}>MT {paid}</Text>
        </View>
        <View style={tw`flex-1`}>
          <Text style={[tw`text-[8px] font-bold uppercase tracking-wider`, { color: colors.textSecondary }]}>{t('Outstanding')}</Text>
          <Text style={tw`text-[13px] ${remaining > 0 ? 'text-amber-500 font-bold' : 'text-[#10B981]'} font-mono mt-1`}>MT {remaining}</Text>
        </View>
      </View>

      {debt.items_json ? (
        <View
          style={[
            tw`border rounded-xl p-2.5 mt-3`,
            {
              backgroundColor: isDark ? '#09090B' : '#F4F4F5',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]} numberOfLines={1}>
            🛒 {t('Items:')} {formatItems(debt.items_json)}
          </Text>
        </View>
      ) : null}

      {/* Collapsible Payment History Section */}
      {payments && payments.length > 0 && (
        <View style={[tw`mt-2.5 border-t pt-2`, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={tw`flex-row justify-between items-center py-1`}
            onPress={() => setShowHistory(!showHistory)}
          >
            <View style={tw`flex-row items-center gap-1.5`}>
              <History size={11} color={colors.textSecondary} />
              <Text style={[tw`text-[9px] font-bold uppercase tracking-wider`, { color: colors.textSecondary }]}>
                {`${t('Payment History')} (${payments.length})`}
              </Text>
            </View>
            {showHistory ? (
              <ChevronUp size={12} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={12} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {showHistory && (
            <View
              style={[
                tw`rounded-xl p-2.5 mt-1.5 gap-2 border`,
                {
                  backgroundColor: isDark ? '#09090B' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
            >
              {payments.map((p, idx) => (
                <View
                  key={p.id || idx}
                  style={[
                    tw`flex-row justify-between items-center`,
                    idx > 0 ? [tw`border-t pt-2`, { borderTopColor: colors.border }] : {},
                  ]}
                >
                  <View>
                    <Text style={[tw`text-[9px] font-bold font-mono`, { color: colors.text }]}>
                      MT {p.amount_mt.toLocaleString()}
                    </Text>
                    <Text style={[tw`text-[7px]`, { color: colors.textSecondary }]}>
                      {new Date(p.created_at).toLocaleDateString()} • {p.payment_method}
                    </Text>
                  </View>
                  {!!p.cashier_name && (
                    <Text style={[tw`text-[7.5px] font-mono`, { color: colors.textSecondary }]}>
                      {`${t('by')} ${p.cashier_name}`}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={tw`flex-row justify-between items-center mt-3.5`}>
        <Text style={[tw`text-[8px] font-mono`, { color: colors.textSecondary }]}>{`${t('Added by')} ${debt.cashier_name || 'Boss'}`}</Text>
        <View style={tw`flex-row items-center gap-2`}>
          {debt.phone_number ? (
            <TouchableOpacity
              style={tw`w-8 h-8 rounded-xl bg-[#25D366]/15 justify-center items-center border border-[#25D366]/30`}
              onPress={() => {
                const message = `Olá ${debt.customer_name}, aqui é da loja. O seu fiado atual está em MT ${remaining}.`;
                Linking.openURL(`whatsapp://send?phone=${debt.phone_number}&text=${encodeURIComponent(message)}`);
              }}
            >
              <MessageCircle size={13} color="#25D366" />
            </TouchableOpacity>
          ) : null}
          {displayStatus !== 'PAID' ? (
            <TouchableOpacity
              style={tw`flex-row items-center gap-1.5 bg-[#059669] px-3 py-1.5 rounded-xl`}
              onPress={onPay}
            >
              <CreditCard size={12} color="#FFF" />
              <Text style={tw`text-white text-[10px] font-bold uppercase tracking-wider`}>{t('PAY')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={tw`flex-row items-center gap-1.5`}>
              <CheckCircle2 size={14} color="#10B981" />
              <Text style={tw`text-[#10B981] text-[10px] font-bold`}>{t('Settled')}</Text>
            </View>
          )}

          {onViewDetails && (
            <TouchableOpacity
              style={[
                tw`w-8 h-8 rounded-xl justify-center items-center border`,
                {
                  backgroundColor: isDark ? '#09090B' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
              onPress={onViewDetails}
            >
              <Eye size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={tw`w-8 h-8 rounded-xl bg-[#4F46E5]/15 justify-center items-center border border-[#4F46E5]/30`}
            onPress={onEdit}
          >
            <Edit2 size={12} color="#6366F1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`w-8 h-8 rounded-xl bg-red-500/15 justify-center items-center border border-red-500/30`}
            onPress={onDelete}
          >
            <Trash2 size={12} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
