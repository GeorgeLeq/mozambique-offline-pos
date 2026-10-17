import { useCallback } from "react";
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getDB } from '../../../lib/db';
import { Product } from '../../../lib/api';

export function useDashboardInventory() {
  const [deadStockValue, setDeadStockValue] = useState(0);
  const [worstDeadStockItem, setWorstDeadStockItem] = useState<{name: string, days: number, cost: number} | null>(null);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [topMovers, setTopMovers] = useState<{name: string, qty: number}[]>([]);
  const [recentDebtors, setRecentDebtors] = useState<{ id: string; customer_name: string; phone_number: string; amount_mt: number; created_at: string }[]>([]);
  const [totalStockQty, setTotalStockQty] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalStockCost, setTotalStockCost] = useState(0);
  const [catalogValue, setCatalogValue] = useState(0);
  const [catalogCost, setCatalogCost] = useState(0);
  const [recentSpoiled, setRecentSpoiled] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const loadInventory = useCallback(async (db: any, startOfDay: string, endOfDay: string, startOf30Days: string, now: Date) => {
    // Inventory Radar
    const lowStock = await db.select("SELECT * FROM products WHERE stock_quantity <= min_stock_alert LIMIT 5") as Product[];
    setLowStockItems(lowStock || []);

    const topProducts = await db.select(`
      SELECT p.name, SUM(s.quantity) as qty 
      FROM sales s 
      JOIN products p ON s.product_id = p.id 
      WHERE s.created_at >= ? AND s.created_at < ? AND s.status != 'voided'
      GROUP BY s.product_id 
      ORDER BY qty DESC LIMIT 4
    `, [startOfDay, endOfDay]) as any[];
    setTopMovers(topProducts || []);

    // Dead Stock
    const recentlySoldIds = await db.select(
      "SELECT DISTINCT product_id FROM sales WHERE created_at >= ? AND status != 'voided'",
      [startOf30Days]
    ) as any[];
    const soldIds = recentlySoldIds.map((r: any) => r.product_id);
    
    const allProductsForDeadStock = await db.select(
      "SELECT id, name, stock_quantity, cost_price_mt FROM products WHERE stock_quantity > 0"
    ) as any[];
    
    let deadCost = 0;
    let worstItem: {name: string, days: number, cost: number, id?: string} | null = null;
    
    const unsoldProducts = allProductsForDeadStock.filter((p: any) => !soldIds.includes(p.id));
    for (const p of unsoldProducts) {
      const cost = (parseFloat(p.cost_price_mt) || 0) * (parseFloat(p.stock_quantity) || 0);
      deadCost += cost;
      if (!worstItem || cost > worstItem.cost) {
        worstItem = { name: p.name, cost: cost, days: 30, id: p.id };
      }
    }
    
    if (worstItem && worstItem.id) {
      const lastSale = await db.select("SELECT created_at FROM sales WHERE product_id = ? AND status != 'voided' ORDER BY created_at DESC LIMIT 1", [worstItem.id]) as any[];
      if (lastSale && lastSale.length > 0) {
         const lastDate = new Date(lastSale[0].created_at);
         const diffTime = Math.abs(now.getTime() - lastDate.getTime());
         worstItem.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
         worstItem.days = 90;
      }
    }
    
    setDeadStockValue(deadCost);
    setWorstDeadStockItem(worstItem ? { name: worstItem.name, days: worstItem.days, cost: worstItem.cost } : null);

    // Debtors, Stock Valuation, Spoilage
    try {
      const debtors = await db.select("SELECT * FROM debts WHERE status = 'unpaid' ORDER BY created_at DESC LIMIT 3") as any[];
      setRecentDebtors(debtors || []);
    } catch (err) {
      console.error("Error loading recent debtors:", err);
    }

    const productsList = await db.select("SELECT id, name, barcode, stock_quantity, price_mt, cost_price_mt, min_stock_alert FROM products") as Product[];
    setAllProducts(productsList || []);
    
    let totalQty = 0, stockVal = 0, stockCost = 0, catVal = 0, catCost = 0;
    
    if (productsList) {
      productsList.forEach(p => {
        const qty = parseFloat(p.stock_quantity as any) || 0;
        const price = parseFloat(p.price_mt as any) || 0;
        const cost = parseFloat((p as any).cost_price_mt as any) || 0;
        
        totalQty += qty;
        
        if (qty > 0) {
          stockVal += (qty * price);
          stockCost += (qty * cost);
        }
        
        catVal += price;
        catCost += cost;
      });
    }
    
    setTotalStockQty(totalQty);
    setTotalStockValue(stockVal);
    setTotalStockCost(stockCost);
    setCatalogValue(catVal);
    setCatalogCost(catCost);

    let spoiled: any[] = [];
    try {
      const rawSpoiled = await db.select(`
        SELECT s.*, p.name as product_name, p.cost_price_mt, p.price_mt 
        FROM spoiled_items s 
        JOIN products p ON s.product_id = p.id 
        ORDER BY s.created_at DESC LIMIT 6
      `) as any[];
      spoiled = (rawSpoiled || []).map(s => {
        const cost = parseFloat(s.cost_price_mt) || parseFloat(s.price_mt) || 0;
        return {
          ...s,
          loss_value: s.quantity * cost
        };
      });
    } catch (e) {
      const rawSpoiled = await db.select("SELECT * FROM spoiled_items") as any[];
      if (rawSpoiled && productsList) {
        spoiled = rawSpoiled.map(s => {
          const p = productsList.find(prod => prod.id === s.product_id);
          const cost = p ? (parseFloat(p.cost_price_mt as any) || parseFloat(p.price_mt as any) || 0) : 0;
          return {
            ...s,
            product_name: p ? p.name : 'Produto Desconhecido',
            loss_value: s.quantity * cost
          };
        }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
      }
    }
    setRecentSpoiled(spoiled || []);
  }, []);

  const handleLogSpoilage = async (productId: string, qty: number, reason: string, authorizedBy: string, onSuccess: () => void) => {
    try {
      const db = await getDB();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      await db.execute(
        "INSERT INTO spoiled_items (id, product_id, quantity, reason, authorized_by, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, 0)",
        [id, productId, qty, reason, authorizedBy, now]
      );
      
      await db.execute(
        "UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?), sync_status = 0 WHERE id = ?",
        [qty, productId]
      );
      
      const auditId = crypto.randomUUID();
      const details = `Quebra registada: ${qty}x para produto ID: ${productId}. Razão: ${reason}. Autorizado por: ${authorizedBy}`;
      await db.execute(
        "INSERT INTO audit_logs (id, action, details, created_at, sync_status) VALUES (?, 'spoilage_registered', ?, ?, 0)",
        [auditId, details, now]
      );
      
      toast.success("Quebra registada com sucesso!");
      onSuccess();
    } catch (err) {
      console.error("Failed to log spoilage:", err);
      toast.error("Erro ao registar quebra.");
    }
  };

  return {
    deadStockValue,
    worstDeadStockItem,
    lowStockItems,
    topMovers,
    recentDebtors,
    totalStockQty,
    totalStockValue,
    totalStockCost,
    catalogValue,
    catalogCost,
    recentSpoiled,
    allProducts,
    loadInventory,
    handleLogSpoilage
  };
}
