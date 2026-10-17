import { useState } from 'react';
import { Product } from '../../../lib/api';

export function useProductModals() {
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [aliasModalProduct, setAliasModalProduct] = useState<Product | null>(null);
  const [printModalProducts, setPrintModalProducts] = useState<Product[]>([]);
  const [infoModalProduct, setInfoModalProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  return {
    isBulkEditModalOpen,
    setIsBulkEditModalOpen,
    aliasModalProduct,
    setAliasModalProduct,
    printModalProducts,
    setPrintModalProducts,
    infoModalProduct,
    setInfoModalProduct,
    productToDelete,
    setProductToDelete
  };
}
