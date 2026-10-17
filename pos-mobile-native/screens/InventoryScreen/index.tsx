import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
} from 'react-native';
import tw from 'twrnc';
import { Package, Search } from 'lucide-react-native';

import { InventoryScreenProps, Product } from './types';
import { useInventory } from './hooks/useInventory';
import InventoryHeader from './components/InventoryHeader';
import FilterPills from './components/FilterPills';
import ProductCard from './components/ProductCard';
import QuickEditModal from './components/QuickEditModal';
import LoadMoreButton from './components/LoadMoreButton';
import { useLanguage } from '../../locales';
import { useTheme } from '../../theme';

export default function InventoryScreen({ shopData, onBack }: InventoryScreenProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const {
    loading,
    refreshing,
    loadingMore,
    products,
    totalCount,
    filteredCount,
    lowStockCount,
    outOfStockCount,
    deliveryPoCount,
    categories,
    hasMore,
    remainingCount,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    onRefresh,
    handleLoadMore,
    quickUpdateProduct,
  } = useInventory(shopData.id);

  // Hardware Back Button
  useEffect(() => {
    if (!onBack) return;
    const handleBack = () => {
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [onBack]);

  const renderProductItem = ({ item }: { item: Product }) => {
    return (
      <ProductCard
        product={item}
        onQuickEdit={(p) => setEditingProduct(p)}
      />
    );
  };

  const renderFooter = () => {
    if (products.length === 0) return null;
    return (
      <LoadMoreButton
        hasMore={hasMore}
        loadingMore={loadingMore}
        remainingCount={remainingCount}
        onLoadMore={handleLoadMore}
      />
    );
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.bg }]}>
      {/* Header with search & refresh */}
      <InventoryHeader
        shopName={shopData.name}
        totalCount={totalCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={onRefresh}
        onBack={onBack}
      />

      {/* Filter Tabs & Category Pills */}
      <FilterPills
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        totalCount={totalCount}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        deliveryPoCount={deliveryPoCount}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Main List */}
      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={[tw`text-xs mt-2 font-mono`, { color: colors.textSecondary }]}>
            {t('Loading inventory items...')}
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-6`}>
          <View
            style={[
              tw`w-16 h-16 rounded-2xl border justify-center items-center mb-3`,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {searchQuery.trim() ? (
              <Search size={28} color={colors.textSecondary} />
            ) : (
              <Package size={28} color={colors.textSecondary} />
            )}
          </View>
          <Text style={[tw`font-bold text-base text-center`, { color: colors.text }]}>
            {searchQuery.trim() ? t('No Matching Products Found') : t('Inventory Empty')}
          </Text>
          <Text style={[tw`text-xs text-center mt-1 max-w-xs`, { color: colors.textSecondary }]}>
            {searchQuery.trim()
              ? `${t('No items match')} "${searchQuery}". ${t('Try adjusting your filters or search keywords.')}`
              : t('There are currently no products registered for this store.')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          ListFooterComponent={renderFooter}
          contentContainerStyle={tw`p-4`}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
            />
          }
        />
      )}

      {/* Instant Price & Stock Quantity Quick-Fix Modal */}
      <QuickEditModal
        visible={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={quickUpdateProduct}
      />
    </View>
  );
}

export * from './types';
