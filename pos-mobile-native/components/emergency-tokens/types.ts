export interface EmergencyToken {
  id: string;
  shop_id: string;
  code: string;
  cashier_id?: string | null;
  cashier_name?: string;
  is_used: boolean;
  used_amount?: number | null;
  used_for?: string | null;
  created_at: string;
  used_at?: string | null;
}

export interface EmployeeOption {
  id: string;
  name: string;
  role?: string;
  phone_number?: string;
  user_id?: string;
  email?: string;
}

export interface EmergencyTokensSectionProps {
  shopData: {
    id: string;
    name?: string;
    currency?: string;
    code?: string;
  };
  employees: EmployeeOption[];
  preselectedCashierId?: string | null;
  onBack?: () => void;
}
