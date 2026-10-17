export type DeliveryStatus = 'pending' | 'in_transit' | 'received' | 'cancelled';

export interface ExpectedDeliveryItem {
  id: string;
  shop_id: string;
  delivery_id: string;
  product_id: string;
  name: string | null;
  barcode: string | null;
  expected_quantity: number;
  received_quantity: number;
  cost_price_mt: number;
  packaging_data?: string | null;
  requires_verification: boolean;
  created_at?: string;
}

export interface ExpectedDelivery {
  id: string;
  shop_id: string;
  po_number: number;
  supplier_name: string;
  expected_date: string | null;
  status: DeliveryStatus;
  created_by?: string | null;
  invoice_number?: string | null;
  created_at: string;
  updated_at: string;
  items?: ExpectedDeliveryItem[];
  items_count?: number;
  total_cost_mt?: number;
}

export interface DeliveriesScreenProps {
  shopData: {
    id: string;
    name: string;
    code: string;
  };
}

export interface PlanEntitlementInfo {
  plan_tier: string;
  is_unlocked: boolean;
  expires_at: string | null;
  plan_name?: string;
  max_deliveries?: number;
  max_products?: number;
  max_fiado_customers?: number;
  features_included?: string[];
  price_mt?: number;
}
