// src/lib/api.ts
import { getDB } from './db';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  price_mt: number;
  cost_price_mt?: number;
  stock_quantity: number;
  is_fractional: boolean;
  category?: string;
  min_stock_alert?: number;
  promo_price_mt?: number;
  promo_active?: boolean;
  attributes?: string;
  requires_verification?: boolean | number;
  is_deleted?: boolean | number;
  sync_status?: number;
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const db = await getDB();
    
    // Check for EAN-13 Variable Weight/Price Barcode
    let isVariable = false;
    let variablePrice = 0;
    let variableWeight = 0;
    let searchBarcode = barcode;

    if (barcode.length === 13 && (barcode.startsWith('20') || barcode.startsWith('21'))) {
      const itemCode = barcode.substring(2, 7);
      const valueStr = barcode.substring(7, 12);
      const value = parseInt(valueStr, 10);
      
      if (barcode.startsWith('20')) {
         variablePrice = value / 100;
         isVariable = true;
      } else if (barcode.startsWith('21')) {
         variableWeight = value / 1000;
         isVariable = true;
      }
      
      // If variable, we'll try to find a product whose barcode is just the 5-digit itemCode, 
      // or starts with 20/21 + itemCode
      const productsByCode = await db.select('SELECT * FROM products WHERE barcode = ? OR barcode LIKE ?', [itemCode, `20${itemCode}%`]) as Product[];
      if (productsByCode && productsByCode.length > 0) {
        const p = productsByCode[0];
        return {
           ...p,
           price_mt: isVariable && variablePrice > 0 ? variablePrice : p.price_mt,
           // If it was weight, price = unit_price * weight
           ...(isVariable && variableWeight > 0 ? { price_mt: p.price_mt * variableWeight } : {})
        };
      }
    }

    // 1. Direct point-lookup by indexed barcode (O(1) index seek)
    const directProducts = await db.select(
      'SELECT * FROM products WHERE barcode = ? LIMIT 1',
      [barcode]
    ) as Product[];

    if (directProducts && directProducts.length > 0) {
      return directProducts[0];
    }

    // 2. Point-lookup via product_aliases with indexed JOIN
    const aliasProducts = await db.select(
      'SELECT p.* FROM products p INNER JOIN product_aliases a ON a.product_id = p.id WHERE a.barcode = ? LIMIT 1',
      [barcode]
    ) as Product[];

    if (aliasProducts && aliasProducts.length > 0) {
      return aliasProducts[0];
    }
    
    // 3. Check if it is a loose label or linked label from barcodes table
    try {
      const labels = await db.select(
        "SELECT * FROM barcodes WHERE barcode = ? LIMIT 1",
        [barcode]
      );
      if (labels && labels.length > 0) {
        const label = labels[0];
        
        // If it's linked to a product, fetch that product but potentially override price/name if they exist on label
        if (label.linked_product_id) {
          const linkedProducts = await db.select('SELECT * FROM products WHERE id = ? LIMIT 1', [label.linked_product_id]) as Product[];
          if (linkedProducts && linkedProducts.length > 0) {
             const lp = linkedProducts[0];
             return {
                ...lp,
                name: label.item_name || lp.name,
                price_mt: label.price_mt || lp.price_mt,
             };
          }
        }
        
        // Otherwise, it's a loose label
        if (label.item_name || label.price_mt) {
           return {
              id: `loose-${label.barcode}`,
              barcode: label.barcode,
              name: label.item_name || 'Generic Item',
              price_mt: label.price_mt || 0,
              stock_quantity: 1,
              is_fractional: false
           };
        }
      }
    } catch(err) {
      console.warn("Could not check barcodes table for loose labels", err);
    }

    return null;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    return null;
  }
}
