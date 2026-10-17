export interface UserStats {
  user_id: string;
  user_name: string;
  scan_count: number;
  total_sales: number;
  items_sold: number;
  payments: {
    cash: number;
    mpesa: number;
    emola: number;
    fiado: number;
  };
  payouts_total: number;
  payouts_count: number;
  sync_status?: number;
}
