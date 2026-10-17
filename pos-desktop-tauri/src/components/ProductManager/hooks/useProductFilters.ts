import { useState, useEffect, useMemo } from 'react';
import { Product } from '../../../lib/api';
import { getDB } from '../../../lib/db';

export function useProductFilters(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'priceAsc' | 'priceDesc'>('name');
  const [globalLowStockThreshold, setGlobalLowStockThreshold] = useState<number>(5);

  // Debounce search term to prevent rapid filtering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    getDB().then(db => {
      db.select('SELECT value FROM settings WHERE key = "low_stock_threshold"').then((res: any[]) => {
        if (res.length > 0) {
          setGlobalLowStockThreshold(parseFloat(res[0].value));
        }
      }).catch(console.error);
    });
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[]);
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (debouncedSearchTerm) {
      const lower = debouncedSearchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        (p.barcode && p.barcode.toLowerCase().includes(lower)) ||
        (p.category && p.category.toLowerCase().includes(lower))
      );
    }
    if (showLowStockOnly) {
      result = result.filter(p => {
        if (p.is_fractional) return false;
        const threshold = p.min_stock_alert !== undefined && p.min_stock_alert !== null ? p.min_stock_alert : globalLowStockThreshold;
        return (p.stock_quantity === undefined || p.stock_quantity === null || p.stock_quantity <= threshold);
      });
    }
    if (showLockedOnly) {
      result = result.filter(p => p.requires_verification === 1 || p.requires_verification === true);
    }
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stockAsc':
          return (a.stock_quantity || 0) - (b.stock_quantity || 0);
        case 'stockDesc':
          return (b.stock_quantity || 0) - (a.stock_quantity || 0);
        case 'priceAsc':
          return a.price_mt - b.price_mt;
        case 'priceDesc':
          return b.price_mt - a.price_mt;
        default:
          return 0;
      }
    });

    return result;
  }, [products, debouncedSearchTerm, showLowStockOnly, showLockedOnly, selectedCategory, sortBy, globalLowStockThreshold]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    showLowStockOnly,
    setShowLowStockOnly,
    showLockedOnly,
    setShowLockedOnly,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    globalLowStockThreshold,
    categories,
    filteredProducts
  };
}
