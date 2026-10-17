import React, { useState } from 'react';
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
import { X, PlusCircle } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';
import { useKeyboard } from '../../../hooks/useKeyboard';

interface CreateDebtModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (debtData: {
    customerName: string;
    amount: string;
    phoneNumber: string;
    address: string;
    items: string;
    cashierName: string;
  }) => void;
}

export default function CreateDebtModal({
  visible,
  onClose,
  onCreate,
}: CreateDebtModalProps) {
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

  const handleCreate = () => {
    Keyboard.dismiss();
    onCreate({
      customerName,
      amount,
      phoneNumber,
      address,
      items,
      cashierName,
    });
    // Reset fields on successful callback trigger
    setCustomerName('');
    setAmount('');
    setPhoneNumber('');
    setAddress('');
    setItems('');
    setCashierName('');
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
                  <PlusCircle size={14} color="#6366F1" />
                </View>
                <Text style={[tw`text-base font-bold tracking-tight`, { color: colors.text }]}>
                  {t('New Fiado Entry')}
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

            {/* Form Fields with dynamic responsive keyboard scrolling */}
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
                  placeholder="e.g. 10kg Arroz, 2L Óleo Alimentar"
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
            </ScrollView>

            {/* Action CTA */}
            <TouchableOpacity
              style={tw`bg-[#10B981] active:bg-emerald-600 h-11 rounded-xl justify-center items-center mt-2`}
              onPress={handleCreate}
              activeOpacity={0.8}
            >
              <Text style={tw`text-zinc-950 text-xs font-black uppercase tracking-wider`}>
                {t('Create Ledger Entry')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
