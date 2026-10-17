export interface Product {
  id: string;
  shop_id: string;
  name: string;
  barcode: string;
  price_mt: number;
  stock_quantity: number;
  min_stock_alert: number;
  category?: string;
  cost_mt?: number;
  created_at?: string;
  updated_at?: string;
}

export type InventoryFilterType = 'all' | 'low_stock' | 'out_of_stock' | 'delivery_po';

export type InventorySortOption = 
  | 'name_asc'
  | 'stock_asc'
  | 'stock_desc'
  | 'price_asc'
  | 'price_desc';

export interface InventoryScreenProps {
  shopData: { id: string; name: string; code: string };
  onBack?: () => void;
}

// Check if a product represents a delivery item awaiting arrival
// typically having a PO barcode rather than standard digits
export function isDeliveryPoProduct(product: { barcode?: string | null; name?: string | null }): boolean {
  if (!product) return false;
  const bc = (product.barcode || '').trim().toUpperCase();
  const nm = (product.name || '').trim().toUpperCase();
  return bc.startsWith('PO') || bc.includes('PO-') || bc.includes('PO#') || nm.startsWith('PO:') || nm.startsWith('PO ');
}
