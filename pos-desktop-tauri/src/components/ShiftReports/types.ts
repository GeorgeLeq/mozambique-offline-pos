export interface ShiftReport {
  id: string;
  user_id: string;
  reported_amount_mt: number;
  expected_amount_mt: number;
  difference_mt: number;
  details_json?: string;
  created_at: string;
}
