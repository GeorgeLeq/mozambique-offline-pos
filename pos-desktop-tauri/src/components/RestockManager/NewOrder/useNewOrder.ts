import React, { useState, useEffect, useRef } from 'react';
import { getDB } from '../../../lib/db';
import { Product } from '../../../lib/api';
import toast from 'react-hot-toast';
import { sanitizeString, sanitizeNumeric } from '../../../lib/security/sanitizer';
import { OrderItemPackaging, RESTOCK_PACK_TYPES, RESTOCK_BULK_METRICS } from './packagingTypes';
import { parseProductMetric } from '../../../lib/utils/productMetric';
import { checkExpectedDeliveryLimit } from '../services/deliveryLimitService';

export interface POItem {
  id: string;
  productName: string;
  barcode?: string;
  quantity: number;
  productId?: string;
  requiresVerification?: boolean;
  packaging?: OrderItemPackaging;
}

export function useNewOrder(currentUser: any, onClose: () => void, onSuccess: () => void) {
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [globalRequiresVerification, setGlobalRequiresVerification] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [items, setItems] = useState<POItem[]>([]);
  
  // Quick Direct Input State
  const [directName, setDirectName] = useState('');
  const [directQty, setDirectQty] = useState('1');
  const [directMode, setDirectMode] = useState<'unit' | 'pack' | 'bulk'>('unit');
  const [directPackType, setDirectPackType] = useState<'pack' | 'box' | 'bundle' | 'crate' | 'other'>('box');
  const [directUnitsPerPack, setDirectUnitsPerPack] = useState('24');
  const [directTotalPacks, setDirectTotalPacks] = useState('1');
  const [directBulkMetric, setDirectBulkMetric] = useState<'kg' | 'g' | 'l' | 'ml'>('kg');
  const [directBulkSize, setDirectBulkSize] = useState('25');
  const [directBulkPkgs, setDirectBulkPkgs] = useState('1');

  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (term: string) => {
    const cleanTerm = sanitizeString(term);
    setSearchTerm(cleanTerm);
    if (cleanTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const db = await getDB();
      const results = await db.select(
        'SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? LIMIT 10',
        [`%${cleanTerm}%`, `%${cleanTerm}%`]
      ) as Product[];
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = (product: Product) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => {
        if (i.id !== existing.id) return i;
        const newQty = i.quantity + 1;
        let newPackaging = i.packaging;
        if (newPackaging?.mode === 'pack') {
          const unitsPer = newPackaging.unitsPerPack || 24;
          newPackaging = {
            ...newPackaging,
            totalPacks: Math.ceil(newQty / unitsPer)
          };
        }
        return { ...i, quantity: newQty, packaging: newPackaging };
      }));
    } else {
      // Check if product is inherently a pack or fractional/bulk
      const metricInfo = parseProductMetric(product.attributes, product.is_fractional);
      let initialPackaging: OrderItemPackaging = { mode: 'unit' };
      let defaultQty = 1;

      if (metricInfo.productType === 'pack' || (metricInfo.packUnitsCount && metricInfo.packUnitsCount > 1)) {
        const units = metricInfo.packUnitsCount || 24;
        initialPackaging = {
          mode: 'pack',
          packType: (metricInfo.packType as any) || 'box',
          unitsPerPack: units,
          totalPacks: 1
        };
        defaultQty = units;
      } else if (metricInfo.productType === 'bulk' || product.is_fractional) {
        const metric = (metricInfo.unitMetric as any) || 'kg';
        const pkgSize = metricInfo.packageTotalQty || 25;
        initialPackaging = {
          mode: 'bulk',
          bulkMetric: metric,
          bulkUnitSize: pkgSize,
          totalBulkPackages: 1
        };
        defaultQty = pkgSize;
      }

      setItems([...items, {
        id: Math.random().toString(),
        productName: product.name,
        barcode: product.barcode,
        quantity: defaultQty,
        productId: product.id,
        requiresVerification: true,
        packaging: initialPackaging
      }]);
    }
    setSearchTerm('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleAddDirect = () => {
    const cleanName = sanitizeString(directName);
    if (!cleanName) {
      return toast.error('Introduza o nome do produto');
    }

    let calculatedQty = 1;
    let packaging: OrderItemPackaging = { mode: 'unit' };

    if (directMode === 'unit') {
      calculatedQty = parseFloat(directQty) || 1;
      packaging = { mode: 'unit' };
    } else if (directMode === 'pack') {
      const packs = parseInt(directTotalPacks, 10) || 1;
      const unitsPer = parseInt(directUnitsPerPack, 10) || 24;
      calculatedQty = packs * unitsPer;
      packaging = {
        mode: 'pack',
        packType: directPackType,
        unitsPerPack: unitsPer,
        totalPacks: packs
      };
    } else if (directMode === 'bulk') {
      const pkgs = parseFloat(directBulkPkgs) || 1;
      const size = parseFloat(directBulkSize) || 25;
      calculatedQty = pkgs * size;
      packaging = {
        mode: 'bulk',
        bulkMetric: directBulkMetric,
        bulkUnitSize: size,
        totalBulkPackages: pkgs
      };
    }

    setItems([...items, {
      id: Math.random().toString(),
      productName: cleanName,
      barcode: 'MANUAL',
      quantity: calculatedQty,
      requiresVerification: true,
      packaging
    }]);

    setDirectName('');
    setDirectQty('1');
    setDirectTotalPacks('1');
    setDirectBulkPkgs('1');
    toast.success('Item adicionado à encomenda');
  };

  const updateItemPackaging = (itemId: string, updatedPackaging: OrderItemPackaging) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      let newQty = item.quantity;
      if (updatedPackaging.mode === 'unit') {
        // Keep current or minimum 1
      } else if (updatedPackaging.mode === 'pack') {
        const packs = updatedPackaging.totalPacks || 1;
        const unitsPer = updatedPackaging.unitsPerPack || 24;
        newQty = packs * unitsPer;
      } else if (updatedPackaging.mode === 'bulk') {
        const pkgs = updatedPackaging.totalBulkPackages || 1;
        const size = updatedPackaging.bulkUnitSize || 25;
        newQty = pkgs * size;
      }
      return {
        ...item,
        quantity: newQty,
        packaging: updatedPackaging
      };
    }));
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,produto,barcode,quantidade\nCoca-Cola 1.5L,123456789,10\nArroz 5kg,987654321,5";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "encomenda_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Modelo CSV descarregado');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const db = await getDB();
        const newItems = [...items];
        
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 2) {
            const prodNameOrCode = parts[0];
            const qty = parseFloat(parts[1] || parts[2]) || 1;
            const prods = await db.select('SELECT * FROM products WHERE barcode = ? OR name LIKE ?', [prodNameOrCode, `%${prodNameOrCode}%`]) as Product[];
            if (prods.length > 0) {
              const prod = prods[0];
              newItems.push({
                id: Math.random().toString(),
                productName: prod.name,
                barcode: prod.barcode,
                quantity: qty,
                productId: prod.id,
                packaging: { mode: 'unit' }
              });
            } else {
              newItems.push({
                id: Math.random().toString(),
                productName: prodNameOrCode,
                barcode: 'CSV',
                quantity: qty,
                packaging: { mode: 'unit' }
              });
            }
          }
        }
        setItems(newItems);
        toast.success('Produtos importados via CSV com sucesso!');
      } catch (err) {
        console.error(err);
        toast.error('Erro ao processar ficheiro CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanSupplier = sanitizeString(supplier);
    const cleanInvoice = sanitizeString(invoiceNumber);
    const cleanDate = sanitizeString(expectedDate);

    if (!cleanSupplier) return toast.error('Nome do fornecedor obrigatório');
    if (items.length === 0) return toast.error('Adicione pelo menos um produto');
    
    setIsSaving(true);
    try {
      // Offline-first subscription quota enforcement
      const limitCheck = await checkExpectedDeliveryLimit(1);
      if (!limitCheck.allowed) {
        toast.error(`Atingiu a capacidade máxima de ${limitCheck.limit} encomendas do Plano Grátis. Atualize para o Plano Pro para cadastrar encomendas ilimitadas.`);
        setIsSaving(false);
        return;
      }

      const db = await getDB();
      const deliveryId = crypto.randomUUID();
      
      const maxRes = await db.select('SELECT MAX(po_number) as max_po FROM expected_deliveries') as any[];
      const nextPoNumber = (maxRes[0]?.max_po && maxRes[0].max_po >= 1000) ? maxRes[0].max_po + 1 : 1001;
      
      await db.execute(
        'INSERT INTO expected_deliveries (id, po_number, invoice_number, supplier_name, expected_date, created_by, requires_verification) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [deliveryId, nextPoNumber, cleanInvoice || null, cleanSupplier, cleanDate || null, currentUser?.id || 'admin', globalRequiresVerification ? 1 : 0]
      );
      
      for (const item of items) {
        const cleanQty = sanitizeNumeric(item.quantity, 1);
        const itemRequiresVerif = globalRequiresVerification && (item.requiresVerification !== false) ? 1 : 0;
        const itemProductName = sanitizeString(item.productName) || 'Produto';
        let prodId = item.productId;
        if (!prodId) {
          const validBarcode = (item.barcode && item.barcode !== 'MANUAL' && item.barcode !== 'CSV') ? item.barcode : '';
          
          let existingProd: any[] = [];
          if (validBarcode) {
            existingProd = await db.select(
              'SELECT id FROM products WHERE name = ? OR barcode = ? LIMIT 1',
              [itemProductName, validBarcode]
            ) as any[];
          } else {
            existingProd = await db.select(
              'SELECT id FROM products WHERE name = ? LIMIT 1',
              [itemProductName]
            ) as any[];
          }

          if (existingProd.length > 0) {
            prodId = existingProd[0].id;
            await db.execute(
              'UPDATE products SET requires_verification = ? WHERE id = ?',
              [itemRequiresVerif, prodId]
            );
          } else {
            let finalBarcode = validBarcode;
            if (!finalBarcode) {
              finalBarcode = `PO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            }

            const barcodeCheck = await db.select(
              'SELECT id FROM products WHERE barcode = ? LIMIT 1',
              [finalBarcode]
            ) as any[];

            if (barcodeCheck.length > 0) {
              finalBarcode = `PO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            }

            prodId = crypto.randomUUID();
            await db.execute(
              'INSERT INTO products (id, name, barcode, cost_price_mt, price_mt, stock_quantity, sync_status, requires_verification) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
              [prodId, itemProductName, finalBarcode, 0, 0, 0, itemRequiresVerif]
            );
          }
        } else {
          await db.execute(
            'UPDATE products SET requires_verification = ? WHERE id = ?',
            [itemRequiresVerif, prodId]
          );
        }

        const packagingJson = item.packaging ? JSON.stringify(item.packaging) : null;

        await db.execute(
          'INSERT INTO expected_delivery_items (id, delivery_id, product_id, name, packaging_data, expected_quantity, received_quantity, cost_price_mt, sync_status, requires_verification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
          [crypto.randomUUID(), deliveryId, prodId, itemProductName, packagingJson, cleanQty, 0, 0, itemRequiresVerif]
        );
      }

      try {
        const { logAudit } = await import('../../../lib/audit');
        const totalItemsQty = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
        await logAudit(
          currentUser?.id,
          'ORDER_CREATED',
          `Criada encomenda PO-${nextPoNumber} (${cleanSupplier}): ${items.length} produtos previstos, ${totalItemsQty} unidades totais.`
        );
      } catch (auditErr) {
        console.warn('Audit logging failed for ORDER_CREATED', auditErr);
      }

      try {
        const { syncExpectedDeliveriesToCloud } = await import('../../../lib/syncEngine/expectedDeliveries');
        const { syncProductsToCloud } = await import('../../../lib/syncEngine/products');
        await Promise.race([
          Promise.all([syncProductsToCloud(), syncExpectedDeliveriesToCloud()]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 3000))
        ]);
      } catch (e) {
        console.warn('Auto sync trigger failed or timed out:', e);
      }
      
      toast.success('Encomenda criada com sucesso');
      onSuccess();
    } catch (err) {
      console.error('Failed to create PO', err);
      toast.error('Erro ao guardar encomenda');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    supplier,
    setSupplier,
    invoiceNumber,
    setInvoiceNumber,
    expectedDate,
    setExpectedDate,
    globalRequiresVerification,
    setGlobalRequiresVerification,
    isSaving,
    searchTerm,
    searchResults,
    items,
    setItems,
    directName,
    setDirectName,
    directQty,
    setDirectQty,
    directMode,
    setDirectMode,
    directPackType,
    setDirectPackType,
    directUnitsPerPack,
    setDirectUnitsPerPack,
    directTotalPacks,
    setDirectTotalPacks,
    directBulkMetric,
    setDirectBulkMetric,
    directBulkSize,
    setDirectBulkSize,
    directBulkPkgs,
    setDirectBulkPkgs,
    updateItemPackaging,
    isFullScreen,
    setIsFullScreen,
    searchInputRef,
    fileInputRef,
    handleSearch,
    handleAddProduct,
    handleAddDirect,
    handleDownloadTemplate,
    handleFileUpload,
    handleSave,
  };
}
