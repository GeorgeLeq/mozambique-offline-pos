import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Search, X, RefreshCw, Package, ArrowLeft } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface InventoryHeaderProps {
  shopName: string;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onRefresh: () => void;
  onBack?: () => void;
}

export default function InventoryHeader({
  shopName,
  totalCount,
  searchQuery,
  onSearchChange,
  onRefresh,
  onBack,
}: InventoryHeaderProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();

  return (
    <View
      style={[
        tw`border-b px-4 pt-3.5 pb-3.5`,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Top Title Bar */}
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <View style={tw`flex-row items-center gap-3 flex-1 mr-2`}>
          {onBack ? (
            <TouchableOpacity
              style={[
                tw`w-9 h-9 rounded-xl border justify-center items-center`,
                {
                  backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                  borderColor: colors.border,
                },
              ]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={16} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={tw`w-9 h-9 rounded-xl bg-[#4F46E5]/15 border border-[#4F46E5]/30 justify-center items-center`}>
              <Package size={17} color="#6366F1" />
            </View>
          )}
          <View style={tw`flex-1`}>
            <Text style={tw`text-[9px] font-bold text-[#6366F1] tracking-wider uppercase`}>
              {`${shopName} • ${t('POS CATALOG')}`}
            </Text>
            <Text style={[tw`text-lg font-semibold tracking-tight uppercase`, { color: colors.text }]} numberOfLines={1}>
              {t('Inventory Control')}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row items-center gap-2`}>
          <View
            style={[
              tw`px-2.5 py-1.5 rounded-xl border`,
              {
                backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[tw`text-[10px] font-mono font-bold`, { color: colors.textSecondary }]}>
              {`${totalCount} ${t('SKUs')}`}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              tw`w-9 h-9 rounded-xl justify-center items-center border`,
              {
                backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                borderColor: colors.border,
              },
            ]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View
        style={[
          tw`flex-row items-center border rounded-xl px-3.5 py-2.5 gap-2.5`,
          {
            backgroundColor: isDark ? '#121215' : '#F4F4F5',
            borderColor: colors.border,
          },
        ]}
      >
        <Search size={15} color={colors.textSecondary} />
        <TextInput
          style={[tw`flex-1 text-xs p-0`, { color: colors.text }]}
          placeholder={t('Search by product name, barcode, or category...')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <X size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}


