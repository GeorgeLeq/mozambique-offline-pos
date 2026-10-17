import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../supabase';
import { Product, InventoryFilterType, InventorySortOption, isDeliveryPoProduct } from '../types';

const PAGE_SIZE = 15;

export function useInventory(shopId: string) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<InventoryFilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<InventorySortOption>('name_asc');

  // Fetch all products for this shop from Supabase
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching inventory products:', error);
      } else {
        setAllProducts(data || []);
      }
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setDisplayCount(PAGE_SIZE);
    fetchProducts();
  }, [fetchProducts]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats);
  }, [allProducts]);

  // Counts for Badges
  const lowStockCount = useMemo(() => {
    return allProducts.filter(
      (p) => (p.stock_quantity ?? 0) <= (p.min_stock_alert ?? 5) && (p.stock_quantity ?? 0) > 0
    ).length;
  }, [allProducts]);

  const outOfStockCount = useMemo(() => {
    return allProducts.filter((p) => (p.stock_quantity ?? 0) <= 0).length;
  }, [allProducts]);

  const deliveryPoCount = useMemo(() => {
    return allProducts.filter((p) => isDeliveryPoProduct(p)).length;
  }, [allProducts]);

  // Filtered & Sorted products list
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Search Query Filter (name, barcode, category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // 2. Main Filter (All, Low Stock, Out of Stock, Delivery PO)
    if (activeFilter === 'low_stock') {
      result = result.filter(
        (p) => (p.stock_quantity ?? 0) <= (p.min_stock_alert ?? 5) && (p.stock_quantity ?? 0) > 0
      );
    } else if (activeFilter === 'out_of_stock') {
      result = result.filter((p) => (p.stock_quantity ?? 0) <= 0);
    } else if (activeFilter === 'delivery_po') {
      result = result.filter((p) => isDeliveryPoProduct(p));
    }

    // 3. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'stock_asc') {
        return (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0);
      } else if (sortBy === 'stock_desc') {
        return (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0);
      } else if (sortBy === 'price_asc') {
        return (a.price_mt ?? 0) - (b.price_mt ?? 0);
      } else if (sortBy === 'price_desc') {
        return (b.price_mt ?? 0) - (a.price_mt ?? 0);
      }
      return 0;
    });

    return result;
  }, [allProducts, searchQuery, activeFilter, selectedCategory, sortBy]);

  // Paginated visible products for Lazy Loading
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const hasMore = displayCount < filteredProducts.length;
  const remainingCount = Math.max(0, filteredProducts.length - displayCount);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 250);
  }, [loadingMore, hasMore]);

  // Quick-Fix Mutation: Instant Price & Stock Quantity Update
  const quickUpdateProduct = async (
    productId: string,
    updates: { price_mt?: number; stock_quantity?: number; min_stock_alert?: number }
  ) => {
    // 1. Optimistic UI update
    const previousProducts = [...allProducts];
    setAllProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );

    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Error updating product in Supabase:', err);
      // Revert on error
      setAllProducts(previousProducts);
      return { success: false, error: err.message };
    }
  };

  return {
    loading,
    refreshing,
    loadingMore,
    products: visibleProducts,
    totalCount: allProducts.length,
    filteredCount: filteredProducts.length,
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
  };
}
