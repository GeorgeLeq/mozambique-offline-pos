import React from 'react';
import { User } from '../../types';

export interface PermissionItem {
  id: string;
  label: string;
  desc: string;
  accessSummary?: string;
  category?: 'vendas' | 'catalogo' | 'financeiro' | 'seguranca' | 'operacoes';
  icon: React.ComponentType<{ size?: number; className?: string }>;
}
