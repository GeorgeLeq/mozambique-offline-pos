import { getDB } from '../../../lib/db';

export interface ExpectedDeliveryPackaging {
  mode?: 'unit' | 'pack' | 'bulk';
  packType?: 'pack' | 'box' | 'bundle' | 'crate' | 'other';
  unitsPerPack?: number;
  totalPacks?: number;
  bulkMetric?: 'kg' | 'g' | 'l' | 'ml';
  bulkUnitSize?: number;
  totalBulkPackages?: number;
  formatDescription?: string;
}

export interface ExpectedDeliveryProductInfo {
  poNumber?: number | string;
  supplierName?: string;
  expectedQuantity: number;
  receivedQuantity: number;
  packaging?: ExpectedDeliveryPackaging;
  deliveryStatus?: string;
  requiresVerification?: boolean | number;
}

/**
 * Retrieves expected delivery item metadata for a specific product ID
 */
export async function getExpectedDeliveryInfoForProduct(productId: string): Promise<ExpectedDeliveryProductInfo | null> {
  if (!productId) return null;
  try {
    const db = await getDB();
    const rows = await db.select(`
      SELECT 
        ei.expected_quantity,
        ei.received_quantity,
        ei.packaging_data,
        ei.requires_verification,
        ed.po_number,
        ed.supplier_name,
        ed.status as delivery_status
      FROM expected_delivery_items ei
      LEFT JOIN expected_deliveries ed ON ei.delivery_id = ed.id
      WHERE ei.product_id = ?
      ORDER BY ei.created_at DESC
      LIMIT 1
    `, [productId]) as any[];

    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    let packaging: ExpectedDeliveryPackaging | undefined = undefined;
    if (row.packaging_data) {
      try {
        packaging = typeof row.packaging_data === 'string' ? JSON.parse(row.packaging_data) : row.packaging_data;
      } catch (e) {
        // ignore JSON parse errors
      }
    }

    return {
      poNumber: row.po_number,
      supplierName: row.supplier_name,
      expectedQuantity: Number(row.expected_quantity) || 0,
      receivedQuantity: Number(row.received_quantity) || 0,
      packaging,
      deliveryStatus: row.delivery_status,
      requiresVerification: row.requires_verification,
    };
  } catch (err) {
    console.warn('Failed to load expected delivery info for product:', err);
    return null;
  }
}
