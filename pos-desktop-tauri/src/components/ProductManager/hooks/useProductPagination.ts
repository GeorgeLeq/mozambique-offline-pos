import { useState, useMemo, useEffect } from 'react';
import { Product } from '../../../lib/api';

export function useProductPagination(
  filteredProducts: Product[], 
  resetTriggers: any[] = [],
  isFocusMode: boolean = false
) {
  const [currentPage, setCurrentPage] = useState(1);
  // Normal mode: 9 products (+2); Expansion mode: 12 products (+3) for zero footer cutoffs
  const itemsPerPage = isFocusMode ? 12 : 9;

  // Reset page to 1 whenever filters/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, resetTriggers);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  // Ensure current page doesn't exceed total pages if list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    paginatedProducts
  };
}
