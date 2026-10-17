import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, PackageX, Edit3, Barcode, Tag, Truck } from 'lucide-react-native';
import tw from 'twrnc';
import { Product, isDeliveryPoProduct } from '../types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface ProductCardProps {
  product: Product;
  onQuickEdit: (product: Product) => void;
}

export default function ProductCard({ product, onQuickEdit }: ProductCardProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const stock = product.stock_quantity ?? 0;
  const minAlert = product.min_stock_alert ?? 5;
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= minAlert;
  const isDeliveryPO = isDeliveryPoProduct(product);

  const formatMoney = (val?: number) => {
    if (val === undefined || val === null) return '0.00';
    return val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getBorderColor = () => {
    if (isDeliveryPO) return 'rgba(99, 102, 241, 0.4)';
    if (isOutOfStock) return 'rgba(239, 68, 68, 0.4)';
    if (isLowStock) return 'rgba(245, 158, 11, 0.4)';
    return colors.border;
  };

  const getBackgroundColor = () => {
    if (isDark) {
      if (isDeliveryPO) return 'rgba(49, 46, 129, 0.15)';
      if (isOutOfStock) return 'rgba(127, 29, 29, 0.15)';
      if (isLowStock) return 'rgba(120, 53, 15, 0.15)';
      return colors.card;
    } else {
      if (isDeliveryPO) return 'rgba(99, 102, 241, 0.05)';
      if (isOutOfStock) return 'rgba(239, 68, 68, 0.05)';
      if (isLowStock) return 'rgba(245, 158, 11, 0.05)';
      return colors.card;
    }
  };

  return (
    <View
      style={[
        tw`rounded-2xl border p-4 mb-3`,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      {/* Top row: Name and Status Badge */}
      <View style={tw`flex-row justify-between items-start gap-2 mb-2.5`}>
        <View style={tw`flex-1`}>
          <Text style={[tw`font-bold text-sm leading-5`, { color: colors.text }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={tw`flex-row items-center gap-3 mt-1.5 flex-wrap`}>
            {product.barcode ? (
              <View style={tw`flex-row items-center gap-1`}>
                <Barcode size={12} color={isDeliveryPO ? '#6366F1' : colors.textSecondary} />
                <Text style={[tw`text-[11px] font-mono`, { color: isDeliveryPO ? '#6366F1' : colors.textSecondary }]}>
                  {isDeliveryPO ? `${t('PO:')} ${product.barcode}` : product.barcode}
                </Text>
              </View>
            ) : null}

            {product.category ? (
              <View style={tw`flex-row items-center gap-1`}>
                <Tag size={11} color={colors.textSecondary} />
                <Text style={[tw`text-[10px] uppercase tracking-wider`, { color: colors.textSecondary }]}>
                  {product.category}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Status Badge */}
        {isDeliveryPO ? (
          <View style={tw`bg-indigo-500/15 border border-indigo-500/35 px-2.5 py-1 rounded-full flex-row items-center gap-1`}>
            <Truck size={11} color="#6366F1" />
            <Text style={tw`text-[9px] font-bold text-indigo-500 uppercase tracking-wider`}>
              {t('In-Transit PO')}
            </Text>
          </View>
        ) : isOutOfStock ? (
          <View style={tw`bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full flex-row items-center gap-1`}>
            <PackageX size={11} color="#EF4444" />
            <Text style={tw`text-[9px] font-bold text-red-500 uppercase`}>
              {t('Out of Stock')}
            </Text>
          </View>
        ) : isLowStock ? (
          <View style={tw`bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full flex-row items-center gap-1`}>
            <AlertTriangle size={11} color="#F59E0B" />
            <Text style={tw`text-[9px] font-bold text-amber-500 uppercase`}>
              {t('Low Stock')}
            </Text>
          </View>
        ) : (
          <View style={tw`bg-[#10B981]/15 border border-[#10B981]/30 px-2.5 py-1 rounded-full`}>
            <Text style={tw`text-[9px] font-bold text-[#10B981] uppercase`}>
              {t('In Stock')}
            </Text>
          </View>
        )}
      </View>

      {/* Delivery PO Notice Banner if awaiting arrival */}
      {isDeliveryPO && (
        <View
          style={[
            tw`mb-2 px-2.5 py-1.5 rounded-lg border flex-row items-center justify-between`,
            {
              backgroundColor: isDark ? 'rgba(49, 46, 129, 0.3)' : 'rgba(238, 242, 255, 1)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
            },
          ]}
        >
          <View style={tw`flex-row items-center gap-1.5 flex-1 mr-2`}>
            <Truck size={11} color="#6366F1" />
            <Text style={[tw`text-[10px] font-medium`, { color: isDark ? '#A5B4FC' : '#4338CA' }]}>
              {t('Shipment product awaiting physical check-in')}
            </Text>
          </View>
          <Text style={tw`text-[9px] font-mono font-bold text-indigo-500 uppercase`}>
            {t('PO Linked')}
          </Text>
        </View>
      )}

      {/* Bottom Info Bar: Price, Stock & Quick-Fix Action */}
      <View
        style={[
          tw`flex-row justify-between items-end pt-3 border-t mt-1`,
          { borderTopColor: colors.border },
        ]}
      >
        {/* Price & Stock */}
        <View style={tw`flex-row gap-4 items-center`}>
          {/* Selling Price */}
          <View>
            <Text style={[tw`text-[9px] font-bold uppercase tracking-wider`, { color: colors.textSecondary }]}>
              {t('Selling Price')}
            </Text>
            <Text style={[tw`text-base font-bold font-mono mt-0.5`, { color: colors.text }]}>
              {`MT ${formatMoney(product.price_mt)}`}
            </Text>
          </View>

          {/* Vertical Divider */}
          <View style={[tw`h-7 w-[1px]`, { backgroundColor: colors.border }]} />

          {/* Current Stock Count */}
          <View>
            <Text style={[tw`text-[9px] font-bold uppercase tracking-wider`, { color: colors.textSecondary }]}>
              {isDeliveryPO ? t('Expected / On Hand') : t('Quantity')}
            </Text>
            <Text
              style={tw`text-base font-bold font-mono mt-0.5 ${
                isDeliveryPO
                  ? 'text-indigo-500'
                  : isOutOfStock
                  ? 'text-red-500'
                  : isLowStock
                  ? 'text-amber-500'
                  : 'text-[#10B981]'
              }`}
            >
              {`${stock} ${t('units')}`}
            </Text>
          </View>
        </View>

        {/* Quick Edit CTA Button */}
        <TouchableOpacity
          style={tw`bg-[#4F46E5]/15 border border-[#4F46E5]/30 active:bg-[#4F46E5] px-3.5 py-2 rounded-xl flex-row items-center gap-1.5`}
          onPress={() => onQuickEdit(product)}
          activeOpacity={0.7}
        >
          <Edit3 size={13} color="#6366F1" />
          <Text style={tw`text-xs font-bold text-[#6366F1]`}>{t('Quick Fix')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


