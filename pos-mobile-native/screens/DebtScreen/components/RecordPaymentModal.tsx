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
import { X, CreditCard } from 'lucide-react-native';
import tw from 'twrnc';
import { Debt } from '../types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';
import { useKeyboard } from '../../../hooks/useKeyboard';

interface RecordPaymentModalProps {
  visible: boolean;
  debt: Debt | null;
  remainingAmount: number;
  onClose: () => void;
  onRegisterPayment: (amount: string, method: string) => void;
}

export default function RecordPaymentModal({
  visible,
  debt,
  remainingAmount,
  onClose,
  onRegisterPayment,
}: RecordPaymentModalProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const isTablet = width >= 600;

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  // Automatically preset the full remaining amount when debt changes
  useEffect(() => {
    if (debt) {
      setPayAmount(remainingAmount > 0 ? remainingAmount.toString() : '');
    } else {
      setPayAmount('');
    }
  }, [debt, remainingAmount]);

  const handleSubmit = () => {
    Keyboard.dismiss();
    onRegisterPayment(payAmount, payMethod);
  };

  const dynamicMaxHeight = isKeyboardVisible
    ? Math.max(260, height - keyboardHeight - (isTablet ? 80 : 36))
    : (isTablet ? Math.min(600, height * 0.85) : height * 0.88);

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
            {/* Header */}
            <View style={[tw`flex-row justify-between items-center pb-3 border-b`, { borderBottomColor: colors.border }]}>
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 items-center justify-center`}>
                  <CreditCard size={14} color="#10B981" />
                </View>
                <Text style={[tw`text-base font-bold tracking-tight`, { color: colors.text }]}>
                  {t('Register Debt Payment')}
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

            {/* Body Content with dynamic height & smooth scroll */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`py-3 gap-3`}
            >
                  {debt ? (
                    <View
                      style={[
                        tw`p-3 rounded-xl border`,
                        {
                          backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={[tw`text-[11px]`, { color: colors.textSecondary }]}>{t('Customer / Debtor')}</Text>
                        <Text style={[tw`text-xs font-bold`, { color: colors.text }]}>{debt.customer_name}</Text>
                      </View>
                      <View style={[tw`flex-row justify-between items-center mt-1.5 pt-1.5 border-t`, { borderTopColor: colors.border }]}>
                        <Text style={[tw`text-[11px]`, { color: colors.textSecondary }]}>{t('Outstanding Balance')}</Text>
                        <Text style={tw`text-xs text-red-500 font-bold font-mono`}>
                          MT {remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  <View>
                    <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                      {t('Payment Received Amount (MT) *')}
                    </Text>
                    <TextInput
                      style={[
                        tw`rounded-xl border h-12 px-3.5 text-base font-bold font-mono`,
                        {
                          backgroundColor: isDark ? '#121215' : '#F4F4F5',
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={payAmount}
                      onChangeText={setPayAmount}
                    />
                  </View>

                  <View>
                    <Text style={[tw`text-[10px] font-bold tracking-wider uppercase mb-1.5`, { color: colors.textSecondary }]}>
                      {t('Payment Method')}
                    </Text>
                    <View style={tw`flex-row gap-2`}>
                      {['Cash', 'M-Pesa', 'E-Mola'].map((method) => {
                        const isSelected = payMethod === method;
                        return (
                          <TouchableOpacity
                            key={method}
                            style={[
                              tw`flex-1 h-10 rounded-xl justify-center items-center border`,
                              isSelected
                                ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }
                                : { backgroundColor: isDark ? '#18181B' : '#F4F4F5', borderColor: colors.border },
                            ]}
                            onPress={() => setPayMethod(method)}
                          >
                            <Text
                              style={[
                                tw`text-xs font-bold`,
                                { color: isSelected ? '#10B981' : colors.textSecondary },
                              ]}
                            >
                              {method === 'Cash' ? t('Cash') : method}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

            {/* Footer Action */}
            <TouchableOpacity
              style={tw`bg-[#10B981] active:bg-emerald-600 h-11 rounded-xl justify-center items-center mt-2`}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={tw`text-zinc-950 text-xs font-black uppercase tracking-wider`}>
                {t('Confirm Payment Receipt')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
