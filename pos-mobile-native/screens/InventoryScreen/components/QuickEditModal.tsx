import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { X, Save, DollarSign, Package } from 'lucide-react-native';
import tw from 'twrnc';
import { Product } from '../types';
import { useToast } from '../../../components/Toast';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';
import { useKeyboard } from '../../../hooks/useKeyboard';
import { useWindowDimensions } from 'react-native';

interface QuickEditModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (
    productId: string,
    updates: { price_mt?: number; stock_quantity?: number; min_stock_alert?: number }
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function QuickEditModal({
  visible,
  product,
  onClose,
  onSave,
}: QuickEditModalProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { isDark, colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const isTablet = width >= 600;

  const [stockQuantity, setStockQuantity] = useState<string>('0');
  const [priceMt, setPriceMt] = useState<string>('0');
  const [minAlert, setMinAlert] = useState<string>('5');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setStockQuantity(String(product.stock_quantity ?? 0));
      setPriceMt(String(product.price_mt ?? 0));
      setMinAlert(String(product.min_stock_alert ?? 5));
    }
  }, [product]);

  if (!product) return null;

  const handleAdjustStock = (delta: number) => {
    const current = parseInt(stockQuantity, 10) || 0;
    const updated = Math.max(0, current + delta);
    setStockQuantity(String(updated));
  };

  const handleAdjustPrice = (delta: number) => {
    const current = parseFloat(priceMt) || 0;
    const updated = Math.max(0, current + delta);
    setPriceMt(String(updated));
  };

  const handleSave = async () => {
    const newStock = parseInt(stockQuantity, 10);
    const newPrice = parseFloat(priceMt);
    const newMin = parseInt(minAlert, 10);

    if (isNaN(newStock) || newStock < 0) {
      showToast(t('Please enter a valid stock quantity.'), 'error');
      return;
    }

    if (isNaN(newPrice) || newPrice < 0) {
      showToast(t('Please enter a valid price.'), 'error');
      return;
    }

    setSaving(true);
    const res = await onSave(product.id, {
      stock_quantity: newStock,
      price_mt: newPrice,
      min_stock_alert: isNaN(newMin) ? 5 : newMin,
    });

    setSaving(false);

    if (res.success) {
      showToast(`${t('Updated')} "${product.name}" ${t('successfully!')}`, 'success');
      onClose();
    } else {
      showToast(`${t('Update failed')}: ${res.error || t('Check connection')}`, 'error');
    }
  };

  const dynamicMaxHeight = isKeyboardVisible
    ? Math.max(260, height - keyboardHeight - (isTablet ? 80 : 36))
    : (isTablet ? Math.min(650, height * 0.85) : height * 0.88);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={[
          tw`flex-1 bg-black/80 justify-end sm:justify-center p-0 sm:p-4`,
          Platform.OS === 'android' && isKeyboardVisible
            ? { paddingBottom: keyboardHeight }
            : null,
        ]}
      >
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
            tw`border rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-lg self-center`,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              maxHeight: dynamicMaxHeight,
            },
          ]}
        >
          {/* Modal Header */}
          <View
            style={[
              tw`flex-row justify-between items-start pb-3 mb-4 border-b`,
              { borderBottomColor: colors.border },
            ]}
          >
            <View style={tw`flex-1 pr-3`}>
              <Text style={tw`text-[10px] font-bold text-[#6366F1] uppercase tracking-widest`}>
                {t('Instant Quick-Fix')}
              </Text>
              <Text style={[tw`text-base font-bold mt-0.5`, { color: colors.text }]} numberOfLines={1}>
                {product.name}
              </Text>
              {product.barcode ? (
                <Text style={[tw`text-xs font-mono mt-0.5`, { color: colors.textSecondary }]}>
                  {`${t('Barcode')}: ${product.barcode}`}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={[
                tw`w-8 h-8 rounded-full border justify-center items-center`,
                {
                  backgroundColor: isDark ? '#09090B' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
              onPress={onClose}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={tw`pb-3`}
          >
            {/* 1. STOCK QUANTITY QUICK-FIX */}
            <View
              style={[
                tw`border rounded-2xl p-4 mb-4`,
                {
                  backgroundColor: isDark ? '#0F0F12' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Package size={15} color="#10B981" />
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: colors.text }]}>
                    {t('Stock Quantity')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStockQuantity('0')}>
                  <Text style={tw`text-[10px] font-bold text-red-500`}>{t('Set Out of Stock (0)')}</Text>
                </TouchableOpacity>
              </View>

              {/* Main Numeric Input */}
              <TextInput
                style={[
                  tw`border rounded-xl px-4 py-3 text-xl font-bold font-mono text-center mb-3`,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                keyboardType="numeric"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                selectTextOnFocus
              />

              {/* Quick Stepper Buttons */}
              <View style={tw`flex-row gap-1.5 justify-between flex-wrap`}>
                {[-10, -5, -1, 1, 5, 10, 50].map((delta) => (
                  <TouchableOpacity
                    key={delta}
                    style={tw`flex-1 min-w-[38px] py-2 rounded-xl items-center justify-center border ${
                      delta > 0
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                    onPress={() => handleAdjustStock(delta)}
                  >
                    <Text
                      style={tw`text-[11px] font-mono font-bold ${
                        delta > 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : `${delta}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. SELLING PRICE (MT) QUICK-FIX */}
            <View
              style={[
                tw`border rounded-2xl p-4 mb-4`,
                {
                  backgroundColor: isDark ? '#0F0F12' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-1.5 mb-2`}>
                <DollarSign size={15} color="#6366F1" />
                <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: colors.text }]}>
                  {t('Selling Price (MT)')}
                </Text>
              </View>

              {/* Main Price Numeric Input */}
              <TextInput
                style={[
                  tw`border rounded-xl px-4 py-3 text-xl font-bold font-mono text-center mb-3`,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                keyboardType="decimal-pad"
                value={priceMt}
                onChangeText={setPriceMt}
                selectTextOnFocus
              />

              {/* Quick Stepper Buttons for Price */}
              <View style={tw`flex-row gap-2 justify-between`}>
                {[5, 10, 50, 100].map((delta) => (
                  <TouchableOpacity
                    key={delta}
                    style={tw`flex-1 py-2 rounded-xl items-center justify-center bg-[#4F46E5]/15 border border-[#4F46E5]/30`}
                    onPress={() => handleAdjustPrice(delta)}
                  >
                    <Text style={tw`text-[11px] font-mono font-bold text-[#6366F1]`}>
                      {`+${delta} MT`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. MINIMUM STOCK ALERT THRESHOLD */}
            <View
              style={[
                tw`border rounded-2xl p-4 mb-5 flex-row justify-between items-center`,
                {
                  backgroundColor: isDark ? '#0F0F12' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={tw`flex-1 pr-3`}>
                <Text style={[tw`text-xs font-bold`, { color: colors.text }]}>{t('Low Stock Alert Threshold')}</Text>
                <Text style={[tw`text-[10px] mt-0.5`, { color: colors.textSecondary }]}>
                  {t('Trigger warning when inventory drops below this')}
                </Text>
              </View>
              <TextInput
                style={[
                  tw`w-16 border rounded-xl px-2 py-2 font-mono font-bold text-center text-sm`,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                keyboardType="numeric"
                value={minAlert}
                onChangeText={setMinAlert}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={tw`flex-row gap-3 pt-2`}>
            <TouchableOpacity
              style={[
                tw`flex-1 border py-3.5 rounded-xl items-center justify-center`,
                {
                  backgroundColor: isDark ? '#09090B' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={[tw`font-bold text-xs uppercase tracking-wider`, { color: colors.text }]}>
                {t('Cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`flex-2 bg-[#4F46E5] active:bg-[#4338CA] py-3.5 rounded-xl flex-row items-center justify-center gap-2`}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Text style={tw`text-white font-bold text-xs uppercase tracking-wider`}>
                    {t('Save Changes')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

