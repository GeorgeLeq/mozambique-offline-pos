/**
 * @file productMetric.ts
 * @description Utility functions for bulk/metric product attribute parsing and calculations.
 */

export interface ProductMetricInfo {
  isFractional: boolean;
  unitMetric: string; // 'kg' | 'g' | 'l' | 'ml' | 'm' | 'cm' | 'un'
  packageTotalQty?: number;
  packageCostPrice?: number;
  packagePrice?: number;
  portionQty?: number;
  // Multi-Packaging & Bundling (Pack, Caixa, Fardo)
  productType?: 'unit' | 'pack' | 'bulk';
  packType?: 'pack' | 'box' | 'bundle' | 'other';
  packUnitsCount?: number;
  parentProductId?: string;
  parentProductName?: string;
}

export const METRIC_OPTIONS = [
  { value: 'kg', label: 'Kilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'un', label: 'Unidade (un)' },
];

export const METRIC_SHORT_LABELS: Record<string, string> = {
  kg: 'kg',
  g: 'g',
  l: 'l',
  ml: 'ml',
  m: 'm',
  cm: 'cm',
  un: 'un',
};

export const PACK_TYPE_LABELS: Record<string, string> = {
  pack: 'Pack',
  box: 'Caixa',
  bundle: 'Fardo',
  other: 'Pacote',
};

export function parseProductMetric(attributes?: string | null, isFractional?: boolean | number): ProductMetricInfo {
  const isFrac = isFractional === 1 || isFractional === true;
  const result: ProductMetricInfo = {
    isFractional: isFrac,
    unitMetric: isFrac ? 'kg' : 'un',
    productType: isFrac ? 'bulk' : 'unit',
  };

  if (!attributes) return result;

  try {
    const parsed = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
    if (parsed && typeof parsed === 'object') {
      if (parsed.unit_metric) result.unitMetric = String(parsed.unit_metric);
      if (parsed.product_type) result.productType = parsed.product_type;
      if (parsed.pack_type) result.packType = parsed.pack_type;
      
      if (parsed.pack_units_count !== undefined && parsed.pack_units_count !== null && parsed.pack_units_count !== '') {
        const val = Number(parsed.pack_units_count);
        if (!isNaN(val) && val > 1) {
          result.packUnitsCount = val;
          if (!parsed.product_type && !isFrac) {
            result.productType = 'pack';
          }
        }
      }

      if (parsed.parent_product_id) result.parentProductId = String(parsed.parent_product_id);
      if (parsed.parent_product_name) result.parentProductName = String(parsed.parent_product_name);

      if (parsed.package_total_qty !== undefined && parsed.package_total_qty !== null && parsed.package_total_qty !== '') {
        const val = Number(parsed.package_total_qty);
        if (!isNaN(val)) result.packageTotalQty = val;
      }
      if (parsed.package_cost_price !== undefined && parsed.package_cost_price !== null && parsed.package_cost_price !== '') {
        const val = Number(parsed.package_cost_price);
        if (!isNaN(val)) result.packageCostPrice = val;
      }
      if (parsed.package_price !== undefined && parsed.package_price !== null && parsed.package_price !== '') {
        const val = Number(parsed.package_price);
        if (!isNaN(val)) result.packagePrice = val;
      }
      if (parsed.portion_qty !== undefined && parsed.portion_qty !== null && parsed.portion_qty !== '') {
        const val = Number(parsed.portion_qty);
        if (!isNaN(val)) result.portionQty = val;
      }
    }
  } catch (e) {
    // Ignore parse errors gracefully
  }

  return result;
}

export function formatMetricQuantity(qty: number, metric: string): string {
  const shortMetric = METRIC_SHORT_LABELS[metric] || metric || 'un';
  return `${qty} ${shortMetric}`;
}

export function getProductDisplayPackaging(attributes?: string | null, isFractional?: boolean | number): {
  isPack: boolean;
  label: string;
  badgeLabel: string;
  unitsCount?: number;
  parentProductId?: string;
  parentProductName?: string;
} {
  const info = parseProductMetric(attributes, isFractional);
  if (info.productType === 'pack' || (info.packUnitsCount && info.packUnitsCount > 1)) {
    const pType = info.packType || 'pack';
    const typeLabel = PACK_TYPE_LABELS[pType] || 'Pack';
    const count = info.packUnitsCount || 6;
    return {
      isPack: true,
      label: `${typeLabel} (${count} un)`,
      badgeLabel: `${typeLabel.toUpperCase()} x${count}`,
      unitsCount: count,
      parentProductId: info.parentProductId,
      parentProductName: info.parentProductName,
    };
  }

  if (info.isFractional) {
    const label = METRIC_SHORT_LABELS[info.unitMetric] || info.unitMetric;
    return {
      isPack: false,
      label: `Granel (${label})`,
      badgeLabel: `GRANEL (${label})`,
    };
  }

  return {
    isPack: false,
    label: 'Unidade (un)',
    badgeLabel: 'UN',
  };
}
