export interface GroupedShiftSale {
  receipt_id: string;
  created_at: string;
  payment_method: string;
  status: string;
  total: number;
  items: {
    product_name: string;
    quantity: number;
    total_mt: number;
  }[];
}

export interface Denomination {
  value: number;
  label: string;
  color: string;
}
