export interface OrderItemPackaging {
  mode: 'unit' | 'pack' | 'bulk';
  packType?: 'pack' | 'box' | 'bundle' | 'crate' | 'other';
  unitsPerPack?: number;
  totalPacks?: number;
  bulkMetric?: 'kg' | 'g' | 'l' | 'ml';
  bulkUnitSize?: number;
  totalBulkPackages?: number;
  formatDescription?: string;
}

export const RESTOCK_PACK_TYPES = [
  { id: 'box', label: 'Caixa', defaultUnits: 24 },
  { id: 'pack', label: 'Pack', defaultUnits: 6 },
  { id: 'bundle', label: 'Fardo', defaultUnits: 20 },
  { id: 'crate', label: 'Grade / Vasilhame', defaultUnits: 24 },
  { id: 'other', label: 'Outro Pacote', defaultUnits: 12 },
] as const;

export const RESTOCK_BULK_METRICS = [
  { id: 'kg', label: 'Quilogramas (kg)', defaultPackage: 25 },
  { id: 'g', label: 'Gramas (g)', defaultPackage: 1000 },
  { id: 'l', label: 'Litros (L)', defaultPackage: 20 },
  { id: 'ml', label: 'Mililitros (ml)', defaultPackage: 500 },
] as const;

/**
 * Returns a human-friendly label of packaging (e.g., "10 Caixas x 24 un (240 un)")
 */
export function formatOrderItemPackaging(packaging?: OrderItemPackaging, totalUnits?: number): string {
  if (!packaging || packaging.mode === 'unit') {
    return totalUnits ? `${totalUnits} un avulsas` : 'Unidades avulsas';
  }

  if (packaging.mode === 'pack') {
    const typeLabel = RESTOCK_PACK_TYPES.find(t => t.id === packaging.packType)?.label || 'Caixa';
    const packs = packaging.totalPacks || 1;
    const unitsPer = packaging.unitsPerPack || 24;
    const computedTotal = packs * unitsPer;
    return `${packs} ${typeLabel}${packs > 1 ? 's' : ''} × ${unitsPer} un (${computedTotal} un total)`;
  }

  if (packaging.mode === 'bulk') {
    const metric = packaging.bulkMetric || 'kg';
    const pkgSize = packaging.bulkUnitSize || 25;
    const totalPkgs = packaging.totalBulkPackages || 1;
    const computedTotal = totalPkgs * pkgSize;
    return `${totalPkgs} Pacote${totalPkgs > 1 ? 's' : ''} de ${pkgSize}${metric} (${computedTotal}${metric} total)`;
  }

  return packaging.formatDescription || `${totalUnits || 0} un`;
}
