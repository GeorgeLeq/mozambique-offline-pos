import { useCallback } from "react";
import { useState } from 'react';
import { getDB } from '../../../lib/db';
import { supabase } from '../../../lib/supabase';

export function useDashboardSettings() {
  const [salesGoal, setSalesGoal] = useState(10000);
  const [rotationSpeed, setRotationSpeed] = useState(15);
  const [taxRate, setTaxRate] = useState(16);
  const [maxDiscountCap, setMaxDiscountCap] = useState(10);
  const [highValueThreshold, setHighValueThreshold] = useState(5000);
  const [maxRefundLimit, setMaxRefundLimit] = useState(3000);
  const [notifRetentionDays, setNotifRetentionDays] = useState<number>(30);
  const [notificationPreferences, setNotificationPreferences] = useState<string[]>(['shift_start', 'voids', 'large_discounts']);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shopName, setShopName] = useState('Loja Maputo Central');

  const loadSettings = useCallback(async (db: any) => {
    // Shop Name
    const sNameRow = await db.select("SELECT value FROM settings WHERE key = 'shop_name'") as any[];
    if (sNameRow?.[0]?.value) {
      setShopName(sNameRow[0].value);
    } else {
      const sIdRow = await db.select("SELECT value FROM settings WHERE key = 'shop_id'") as any[];
      if (sIdRow?.[0]?.value) {
        const { data } = await supabase.from('shops').select('name').eq('id', sIdRow[0].value).single();
        if (data?.name) {
          setShopName(data.name);
          await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('shop_name', ?)", [data.name]);
        }
      }
    }

    const salesGoalRow = await db.select("SELECT value FROM settings WHERE key = 'daily_sales_goal'") as any[];
    setSalesGoal(parseFloat(salesGoalRow?.[0]?.value || '10000'));

    const rotationRow = await db.select("SELECT value FROM settings WHERE key = 'rotation_speed'") as any[];
    setRotationSpeed(parseInt(rotationRow?.[0]?.value || '15', 10));

    const taxRateRow = await db.select("SELECT value FROM settings WHERE key = 'tax_rate'") as any[];
    setTaxRate(parseFloat(taxRateRow?.[0]?.value || '16'));

    const discountCapRow = await db.select("SELECT value FROM settings WHERE key = 'max_discount_cap'") as any[];
    setMaxDiscountCap(parseFloat(discountCapRow?.[0]?.value || '10'));

    const highValRow = await db.select("SELECT value FROM settings WHERE key = 'high_value_threshold'") as any[];
    setHighValueThreshold(parseFloat(highValRow?.[0]?.value || '5000'));

    const maxRefRow = await db.select("SELECT value FROM settings WHERE key = 'max_refund_limit'") as any[];
    setMaxRefundLimit(parseFloat(maxRefRow?.[0]?.value || '3000'));

    const retentionRow = await db.select("SELECT value FROM settings WHERE key = 'notif_retention_days'") as any[];
    if (retentionRow?.[0]?.value) {
      setNotifRetentionDays(parseInt(retentionRow[0].value, 10) || 30);
    }

    const notifPrefsRow = await db.select("SELECT value FROM settings WHERE key = 'notification_preferences'") as any[];
    if (notifPrefsRow?.[0]?.value) {
      setNotificationPreferences(notifPrefsRow[0].value.split(',').filter(Boolean));
    }
  }, []);

  const handleUpdateSalesGoal = async (val: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('daily_sales_goal', ?)", [val.toString()]);
      setSalesGoal(val);
    } catch (err) {
      console.error("Error saving daily_sales_goal setting:", err);
    }
  };

  const handleUpdateRotationSpeed = async (val: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('rotation_speed', ?)", [val.toString()]);
      setRotationSpeed(val);
    } catch (err) {
      console.error("Error saving rotation_speed setting:", err);
    }
  };

  const handleUpdateTaxRate = async (val: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('tax_rate', ?)", [val.toString()]);
      setTaxRate(val);
      localStorage.setItem('tax_rate', val.toString());
    } catch (err) {
      console.error("Error saving tax_rate setting:", err);
    }
  };

  const handleUpdateMaxDiscountCap = async (val: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('max_discount_cap', ?)", [val.toString()]);
      setMaxDiscountCap(val);
    } catch (err) {
      console.error("Error saving max_discount_cap setting:", err);
    }
  };

  const handleUpdateHighValueThreshold = async (val: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('high_value_threshold', ?)", [val.toString()]);
      setHighValueThreshold(val);
    } catch (err) {
      console.error("Error saving high_value_threshold setting:", err);
    }
  };

  const handleUpdateMaxRefundLimit = async (val: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('max_refund_limit', ?)", [val.toString()]);
      setMaxRefundLimit(val);
    } catch (err) {
      console.error("Error saving max_refund_limit setting:", err);
    }
  };

  const handleUpdateNotificationPreferences = async (prefs: string[]) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('notification_preferences', ?)", [prefs.join(',')]);
      setNotificationPreferences(prefs);
    } catch (err) {
      console.error("Error saving notification_preferences setting:", err);
    }
  };

  const handleUpdateNotifRetentionDays = async (days: number) => {
    try {
      const db = await getDB();
      await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('notif_retention_days', ?)", [days.toString()]);
      setNotifRetentionDays(days);
    } catch (err) {
      console.error("Error saving notif_retention_days setting:", err);
    }
  };

  return {
    shopName,
    salesGoal,
    rotationSpeed,
    taxRate,
    maxDiscountCap,
    highValueThreshold,
    maxRefundLimit,
    notifRetentionDays,
    notificationPreferences,
    isSettingsOpen,
    setIsSettingsOpen,
    loadSettings,
    handleUpdateSalesGoal,
    handleUpdateRotationSpeed,
    handleUpdateTaxRate,
    handleUpdateMaxDiscountCap,
    handleUpdateHighValueThreshold,
    handleUpdateMaxRefundLimit,
    handleUpdateNotifRetentionDays,
    handleUpdateNotificationPreferences
  };
}
