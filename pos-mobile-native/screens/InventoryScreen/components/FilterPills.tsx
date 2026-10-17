import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import {
  AlertTriangle,
  PackageX,
  Layers,
  ArrowUpDown,
  Check,
  X,
  Truck,
} from 'lucide-react-native';
import tw from 'twrnc';
import { InventoryFilterType, InventorySortOption } from '../types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface FilterPillsProps {
  activeFilter: InventoryFilterType;
  onFilterChange: (filter: InventoryFilterType) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  deliveryPoCount?: number;
  sortBy: InventorySortOption;
  onSortChange: (sort: InventorySortOption) => void;
}

const SORT_OPTIONS: { id: InventorySortOption; label: string }[] = [
  { id: 'name_asc', label: 'Name (A to Z)' },
  { id: 'stock_asc', label: 'Stock (Lowest First)' },
  { id: 'stock_desc', label: 'Stock (Highest First)' },
  { id: 'price_asc', label: 'Price (Lowest First)' },
  { id: 'price_desc', label: 'Price (Highest First)' },
];

export default function FilterPills({
  activeFilter,
  onFilterChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalCount,
  lowStockCount,
  outOfStockCount,
  deliveryPoCount = 0,
  sortBy,
  onSortChange,
}: FilterPillsProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [showSortModal, setShowSortModal] = useState(false);

  return (
    <View
      style={[
        tw`py-3 border-b`,
        {
          backgroundColor: colors.bg,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Primary Status Filters */}
      <View style={tw`flex-row px-4 gap-1.5 mb-2.5 flex-wrap`}>
        {/* All Filter */}
        <TouchableOpacity
          style={[
            tw`flex-1 min-w-[70px] py-2 px-2 rounded-xl border flex-row items-center justify-center gap-1`,
            activeFilter === 'all'
              ? { backgroundColor: 'rgba(79, 70, 229, 0.15)', borderColor: '#4F46E5' }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => onFilterChange('all')}
        >
          <Layers size={12} color={activeFilter === 'all' ? '#6366F1' : colors.textSecondary} />
          <Text
            style={[
              tw`text-[10.5px] font-bold`,
              { color: activeFilter === 'all' ? '#6366F1' : colors.textSecondary },
            ]}
          >
            {`${t('All')} (${totalCount})`}
          </Text>
        </TouchableOpacity>

        {/* PO Deliveries Filter */}
        <TouchableOpacity
          style={[
            tw`flex-1 min-w-[85px] py-2 px-2 rounded-xl border flex-row items-center justify-center gap-1`,
            activeFilter === 'delivery_po'
              ? { backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366F1' }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => onFilterChange('delivery_po')}
        >
          <Truck
            size={12}
            color={activeFilter === 'delivery_po' ? '#818CF8' : colors.textSecondary}
          />
          <Text
            style={[
              tw`text-[10.5px] font-bold`,
              { color: activeFilter === 'delivery_po' ? '#6366F1' : colors.textSecondary },
            ]}
          >
            {`${t('PO Due')} (${deliveryPoCount})`}
          </Text>
        </TouchableOpacity>

        {/* Low Stock Filter */}
        <TouchableOpacity
          style={[
            tw`flex-1 min-w-[70px] py-2 px-2 rounded-xl border flex-row items-center justify-center gap-1`,
            activeFilter === 'low_stock'
              ? { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.6)' }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => onFilterChange('low_stock')}
        >
          <AlertTriangle
            size={12}
            color={activeFilter === 'low_stock' ? '#F59E0B' : colors.textSecondary}
          />
          <Text
            style={[
              tw`text-[10.5px] font-bold`,
              { color: activeFilter === 'low_stock' ? '#F59E0B' : colors.textSecondary },
            ]}
          >
            {`${t('Low')} (${lowStockCount})`}
          </Text>
        </TouchableOpacity>

        {/* Out of Stock Filter */}
        <TouchableOpacity
          style={[
            tw`flex-1 min-w-[70px] py-2 px-2 rounded-xl border flex-row items-center justify-center gap-1`,
            activeFilter === 'out_of_stock'
              ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.6)' }
              : { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => onFilterChange('out_of_stock')}
        >
          <PackageX
            size={12}
            color={activeFilter === 'out_of_stock' ? '#EF4444' : colors.textSecondary}
          />
          <Text
            style={[
              tw`text-[10.5px] font-bold`,
              { color: activeFilter === 'out_of_stock' ? '#EF4444' : colors.textSecondary },
            ]}
          >
            {`${t('Out')} (${outOfStockCount})`}
          </Text>
        </TouchableOpacity>

        {/* Sort Trigger */}
        <TouchableOpacity
          style={[
            tw`py-2 px-2.5 rounded-xl border flex-row items-center justify-center`,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => setShowSortModal(true)}
        >
          <ArrowUpDown size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Category Pills (Horizontal Scroll) */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`px-4 gap-1.5`}
        >
          <TouchableOpacity
            style={[
              tw`py-1.5 px-3 rounded-xl border`,
              selectedCategory === 'all'
                ? { backgroundColor: 'rgba(79, 70, 229, 0.15)', borderColor: 'rgba(79, 70, 229, 0.4)' }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => onCategoryChange('all')}
          >
            <Text
              style={[
                tw`text-[10px] font-bold uppercase tracking-wider`,
                { color: selectedCategory === 'all' ? '#6366F1' : colors.textSecondary },
              ]}
            >
              {t('All Categories')}
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isCatSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  tw`py-1.5 px-3 rounded-xl border`,
                  isCatSelected
                    ? { backgroundColor: 'rgba(79, 70, 229, 0.15)', borderColor: 'rgba(79, 70, 229, 0.4)' }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => onCategoryChange(cat)}
              >
                <Text
                  style={[
                    tw`text-[10px] font-bold uppercase tracking-wider`,
                    { color: isCatSelected ? '#6366F1' : colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Sort Selector Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={tw`flex-1 bg-black/80 justify-end sm:justify-center p-4`}>
          <View
            style={[
              tw`border rounded-2xl p-5 w-full max-w-sm self-center`,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                tw`flex-row justify-between items-center mb-4 pb-3 border-b`,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: colors.text }]}>
                {t('Sort Products By')}
              </Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={tw`gap-2`}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      tw`p-3 rounded-xl flex-row justify-between items-center border`,
                      isSelected
                        ? { backgroundColor: 'rgba(79, 70, 229, 0.15)', borderColor: '#4F46E5' }
                        : {
                            backgroundColor: isDark ? '#121215' : '#F4F4F5',
                            borderColor: colors.border,
                          },
                    ]}
                    onPress={() => {
                      onSortChange(opt.id);
                      setShowSortModal(false);
                    }}
                  >
                    <Text
                      style={[
                        tw`text-xs font-semibold`,
                        { color: isSelected ? '#6366F1' : colors.text },
                      ]}
                    >
                      {t(opt.label)}
                    </Text>
                    {isSelected && <Check size={14} color="#6366F1" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

