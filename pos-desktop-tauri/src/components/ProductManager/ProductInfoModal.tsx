import React from 'react';
import { Product } from '../../lib/api';
import { ProductDetailsModal } from './ProductDetailsModal';
import { ProductGuideModal } from './ProductGuideModal';

interface ProductInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  isAdminUnlocked?: boolean;
  onPromptAdminPin?: (onSuccess: () => void) => void;
}

export function ProductInfoModal({
  isOpen,
  onClose,
  product,
  isAdminUnlocked = false,
  onPromptAdminPin
}: ProductInfoModalProps) {
  if (product) {
    return (
      <ProductDetailsModal
        isOpen={isOpen}
        onClose={onClose}
        product={product}
        isAdminUnlocked={isAdminUnlocked}
        onPromptAdminPin={onPromptAdminPin}
      />
    );
  }

  return (
    <ProductGuideModal
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}

export { ProductDetailsModal, ProductGuideModal };
