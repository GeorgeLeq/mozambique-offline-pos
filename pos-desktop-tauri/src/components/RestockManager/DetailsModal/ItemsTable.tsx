import React from 'react';
import { ExpectedItemsTable } from '../common/ExpectedItemsTable';

interface ItemsTableProps {
  items: any[];
  delivery: any;
  receivedQtyMap: Record<string, number>;
  setReceivedQtyMap: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  verificationMap: Record<string, number>;
  handleToggleItemVerification: (item: any) => void;
  handleRestoreProduct?: (productId: string, productName: string) => void;
}

export function ItemsTable({
  items,
  delivery,
  receivedQtyMap,
  setReceivedQtyMap,
  verificationMap,
  handleToggleItemVerification,
  handleRestoreProduct,
}: ItemsTableProps) {
  return (
    <ExpectedItemsTable
      items={items}
      mode="details"
      receivedQtyMap={receivedQtyMap}
      verificationMap={verificationMap}
      handleToggleItemVerification={handleToggleItemVerification}
      handleRestoreProduct={handleRestoreProduct}
    />
  );
}
