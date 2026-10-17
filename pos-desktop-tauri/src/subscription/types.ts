/**
 * @file types.ts
 * @description Types, interfaces, and plan definitions for the offline-first subscription system.
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | 'custom';

export type FeatureKey = 
  | 'client_debts'          // Gestão de Fiados, Dívidas e Clientes
  | 'expected_deliveries'   // Encomendas Previstas e Fornecedores
  | 'advanced_audits'       // Auditoria Avançada e Anti-Roubo
  | 'cloud_backup'          // Sincronização e Cópia de Segurança na Nuvem (Sync Engine)
  | 'multi_cashier'         // Múltiplos Caixas em Rede Local
  | 'unlimited_products'    // Catálogo e Inventário de Produtos Ilimitados
  | 'unlimited_barcodes'    // Códigos de Barras e Etiquetas Ilimitados
  | 'unlimited_users'       // Operadores e Utilizadores Ilimitados
  | 'custom_permissions'   // Controlo Avançado e Granular de Permissões
  | 'companion_app';        // App Companion em Tempo Real no Telemóvel

export interface FeatureEntitlement {
  id: string;               // Feature identifier (e.g., 'client_debts')
  feature_key: FeatureKey;
  name: string;
  description: string;
  is_unlocked: boolean;
  plan_tier: SubscriptionTier;
  unlocked_at?: string | null;
  expires_at?: string | null; // ISO string or null for lifetime / permanent
  source: 'default' | 'license_code' | 'cloud_sync' | 'trial';
  signature?: string;
  sync_status?: number;
  updated_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  price_mt: number;
  period: 'monthly' | 'quarterly' | 'annual' | 'lifetime';
  period_label: string;
  features_included: FeatureKey[];
  max_fiado_customers?: number;
  max_products?: number;
  max_deliveries?: number;
  max_barcodes?: number;
  max_users?: number;
  advanced_audits?: boolean;
  custom_permissions?: boolean;
  unlimited_users?: boolean;
  cloud_backup?: boolean;
  cloud_audit_archive?: boolean;
  addons?: string[];
  is_popular?: boolean;
  badge?: string;
  description: string;
}

export interface PaymentProofSubmission {
  id: string;
  shop_id: string;
  device_id: string;
  feature_key: string;
  plan_id: string;
  amount_mt: number;
  payment_method: 'mpesa' | 'emola' | 'cash';
  reference_code: string;
  phone_number?: string;
  screenshot_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  submitted_at: string;
  approved_at?: string;
  sync_status?: number;
}

export interface OfflineLicensePayload {
  shop_id: string;
  device_id: string;
  feature_key: string;
  valid_days: number; // e.g. 30, 90, 365, or 9999 for lifetime
  issued_timestamp: number;
  nonce: string;
}
