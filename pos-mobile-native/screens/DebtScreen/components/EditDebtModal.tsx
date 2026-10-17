import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { X, Edit } from 'lucide-react-native';
import tw from 'twrnc';
import { Debt } from '../types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';
import { useKeyboard } from '../../../hooks/useKeyboard';

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

interface EditDebtModalProps {
  visible: boolean;
  debt: Debt | null;
  onClose: () => void;
  onUpdate: (updatedData: {
    customerName: string;
    amount: string;
    phoneNumber: string;
    address: string;
    items: string;
    cashierName: string;
    status: 'unpaid' | 'paid';
  }) => void;
}

export default function EditDebtModal({
  visible,
  debt,
  onClose,
  onUpdate,
}: EditDebtModalProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const isTablet = width >= 600;

  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [items, setItems] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [status, setStatus] = useState<'unpaid' | 'paid'>('unpaid');

  // Sync state when active debt changes
  useEffect(() => {
    if (debt) {
      setCustomerName(debt.customer_name);
      setAmount(debt.amount_mt.toString());
      setPhoneNumber(debt.phone_number || '');
      setAddress(debt.address || '');
      setItems(formatItems(debt.items_json));
      setCashierName(debt.cashier_name || '');
      setStatus(debt.status);
    }
  }, [debt]);

  const handleSave = () => {
    Keyboard.dismiss();
    onUpdate({
      customerName,
      amount,
      phoneNumber,
      address,
      items,
      cashierName,
      status,
    });
  };

  const dynamicMaxHeight = isKeyboardVisible
    ? Math.max(260, height - keyboardHeight - (isTablet ? 80 : 36))
    : (isTablet ? Math.min(650, height * 0.85) : height * 0.88);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={tw`flex-1`}
      >
        <View
          style={[
            tw`flex-1 bg-black/80`,
            isTablet
              ? tw`justify-center items-center px-6`
              : tw`justify-end`,
            Platform.OS === 'android' && isKeyboardVisible
              ? { paddingBottom: keyboardHeight }
              : null,
          ]}
        >
          {/* Dismiss keyboard/modal on backdrop tap */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
          />

          <View
            style={[
              tw`border p-5 shadow-2xl`,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                maxHeight: dynamicMaxHeight,
              },
              isTablet
                ? tw`w-full max-w-lg rounded-2xl`
                : tw`w-full rounded-t-3xl`,
            ]}
          >
            {/* Modal Header */}
            <View style={[tw`flex-row justify-between items-center pb-3 border-b`, { borderBottomColor: colors.border }]}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 items-center justify-center`}>
                  <Edit size={14} color="#6366F1" />
                </View>
                <Text style={[tw`text-base font-bold tracking-tight`, { color: colors.text }]}>
                  {t('Edit Fiado Entry')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  tw`w-7 h-7 rounded-lg items-center justify-center`,
                  { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
                ]}
              >
                <X size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form Body */}
            <ScrollView
              style={{ flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`py-3 gap-3 pb-4`}
            >
              <View>
                <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                  {t('Debtor Customer Name *')}
                </Text>
                <TextInput
                  style={[
                    tw`rounded-xl border h-11 px-3 text-sm`,
                    {
                      backgroundColor: isDark ? '#121215' : '#F4F4F5',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. João Nhaca"
                  placeholderTextColor={colors.textMuted}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              <View>
                <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                  {t('Debt Amount (MT) *')}
                </Text>
                <TextInput
                  style={[
                    tw`rounded-xl border h-11 px-3 text-base font-bold font-mono`,
                    {
                      backgroundColor: isDark ? '#121215' : '#F4F4F5',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View>
                <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                  {t('Phone Number (Optional)')}
                </Text>
                <TextInput
                  style={[
                    tw`rounded-xl border h-11 px-3 text-sm font-mono`,
                    {
                      backgroundColor: isDark ? '#121215' : '#F4F4F5',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. +258 84 123 4567"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <View>
                <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                  {t('Neighborhood / Address (Optional)')}
                </Text>
                <TextInput
                  style={[
                    tw`rounded-xl border h-11 px-3 text-sm`,
                    {
                      backgroundColor: isDark ? '#121215' : '#F4F4F5',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Maxaquene A, Bairro Central"
                  placeholderTextColor={colors.textMuted}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View>
                <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                  {t('Items Purchased on Credit')}
                </Text>
                <TextInput
                  style={[
                    tw`rounded-xl border h-11 px-3 text-sm`,
                    {
                      backgroundColor: isDark ? '#121215' : '#F4F4F5',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. 10kg Arroz, 2L Óleo"
                  placeholderTextColor={colors.textMuted}
                  value={items}
                  onChangeText={setItems}
                />
              </View>

              <View>
                <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                  {t('Cashier / Attendant Name')}
                </Text>
                <TextInput
                  style={[
                    tw`rounded-xl border h-11 px-3 text-sm`,
                    {
                      backgroundColor: isDark ? '#121215' : '#F4F4F5',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Helena"
                  placeholderTextColor={colors.textMuted}
                  value={cashierName}
                  onChangeText={setCashierName}
                />
              </View>

              <View>
                <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                  {t('Status')}
                </Text>
                <View style={tw`flex-row gap-2`}>
                  {(['unpaid', 'paid'] as const).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        tw`flex-1 h-10 rounded-xl justify-center items-center border`,
                        status === st
                          ? st === 'paid'
                            ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }
                            : { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }
                          : { backgroundColor: isDark ? '#18181B' : '#F4F4F5', borderColor: colors.border },
                      ]}
                      onPress={() => setStatus(st)}
                    >
                      <Text
                        style={[
                          tw`text-xs font-bold uppercase`,
                          status === st
                            ? { color: st === 'paid' ? '#10B981' : '#EF4444' }
                            : { color: colors.textSecondary },
                        ]}
                      >
                        {st === 'paid' ? t('Paid') : t('Unpaid')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer Action */}
            <TouchableOpacity
              style={tw`bg-[#4F46E5] active:bg-indigo-600 h-11 rounded-xl justify-center items-center mt-2`}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={tw`text-white text-xs font-black uppercase tracking-wider`}>
                {t('Save Changes')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
