export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Cashier';
  pin: string;
  permissions_json?: string;
  sync_status?: number;
  opening_cash?: number;
  needs_shift_cash?: number;
  is_blocked?: number;
  current_shift_start?: string;
  current_shift_cash?: number;
  terminal_name?: string;
  is_deleted?: number;
  deleted_at?: string | null;
  deletion_reason?: string | null;
  deleted_by?: string | null;
}

declare module 'react-barcode';