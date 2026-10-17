export interface LocalSale {
  id: string;
  product_id: string;
  quantity: number;
  total_mt: number;
  is_synced: number; // SQLite stores booleans as 0 or 1
  created_at: string;
}
