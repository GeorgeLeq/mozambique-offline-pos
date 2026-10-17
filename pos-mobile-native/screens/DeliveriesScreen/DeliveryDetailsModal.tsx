import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import {
  X,
  Truck,
  CheckCircle2,
  Calendar,
  Barcode,
  Package,
  FileText,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react-native';
import { ExpectedDelivery, ExpectedDeliveryItem } from './types';
import { DeliveryReceiptBadge, DeliveryTimingBadge } from './components/DeliveryBadges';
import { supabase } from '../../supabase';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../locales';
import { useTheme } from '../../theme';

interface DeliveryDetailsModalProps {
  visible: boolean;
  delivery: ExpectedDelivery | null;
  onClose: () => void;
  onStatusUpdated: (updatedDelivery: ExpectedDelivery) => void;
}

export default function DeliveryDetailsModal({
  visible,
  delivery,
  onClose,
  onStatusUpdated,
}: DeliveryDetailsModalProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  if (!delivery) return null;

  const items = delivery.items || [];
  const isReceived = delivery.status === 'received';
  const totalCost = items.reduce(
    (sum, item) => sum + (item.cost_price_mt || 0) * (item.expected_quantity || 0),
    0
  );
  const totalUnits = items.reduce((sum, item) => sum + (item.expected_quantity || 0), 0);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'received':
        return t('Received');
      case 'in_transit':
        return t('In Transit');
      case 'cancelled':
        return t('Cancelled');
      case 'pending':
      default:
        return t('Pending');
    }
  };

  const formatExpectedDate = (dateStr: string | null) => {
    if (!dateStr) return t('Unscheduled');
    const d = new Date(dateStr);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `${t('Today at')} ${timeStr}`;
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${t('at')} ${timeStr}`;
  };

  const handleMarkAsReceived = async () => {
    Alert.alert(
      t('Confirm Delivery Reception'),
      `${t('Mark PO')} #${delivery.po_number} ${t('from')} "${delivery.supplier_name}" ${t('as fully received?')}`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Confirm Received'),
          style: 'default',
          onPress: async () => {
            setUpdating(true);
            try {
              // Update delivery status in Supabase
              const { error: deliveryError } = await supabase
                .from('expected_deliveries')
                .update({
                  status: 'received',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', delivery.id);

              if (deliveryError) throw deliveryError;

              // Optionally mark items received quantity = expected quantity
              if (items.length > 0) {
                await Promise.all(
                  items.map((item) =>
                    supabase
                      .from('expected_delivery_items')
                      .update({
                        received_quantity: item.expected_quantity,
                      })
                      .eq('id', item.id)
                  )
                );
              }

              const updated: ExpectedDelivery = {
                ...delivery,
                status: 'received',
                items: items.map((i) => ({ ...i, received_quantity: i.expected_quantity })),
              };

              showToast(`✅ ${t('Delivery PO')} #${delivery.po_number} ${t('marked as Received!')}`, 'success');
              onStatusUpdated(updated);
            } catch (err: any) {
              console.error('Failed to update delivery status:', err);
              showToast(err.message || t('Failed to update delivery status'), 'error');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/80 justify-end`}>
        <View
          style={[
            tw`rounded-t-3xl border-t max-h-[90%] pb-6`,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          {/* Header handle & Close */}
          <View style={tw`items-center pt-3 pb-1`}>
            <View style={[tw`w-12 h-1 rounded-full`, { backgroundColor: isDark ? '#3F3F46' : '#D4D4D8' }]} />
          </View>

          <View style={[tw`flex-row items-center justify-between px-5 py-3 border-b`, { borderBottomColor: colors.border }]}>
            <View style={tw`flex-row items-center flex-1 mr-3`}>
              <View style={tw`w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center mr-3`}>
                <Truck size={20} color="#6366F1" />
              </View>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                  <Text style={[tw`font-bold text-base`, { color: colors.text }]} numberOfLines={1}>
                    {delivery.supplier_name}
                  </Text>
                  <DeliveryReceiptBadge delivery={delivery} />
                </View>
                <Text style={[tw`text-xs font-mono mt-0.5`, { color: colors.textSecondary }]}>
                  PO #{delivery.po_number} {delivery.invoice_number ? `• Inv: ${delivery.invoice_number}` : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                tw`w-8 h-8 rounded-full items-center justify-center`,
                { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={tw`px-5 pt-4`} showsVerticalScrollIndicator={false}>
            {/* Meta Information Cards */}
            <View style={tw`flex-row gap-2.5 mb-4`}>
              <View
                style={[
                  tw`flex-1 p-3 rounded-xl border`,
                  {
                    backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={tw`flex-row items-center justify-between mb-1.5`}>
                  <View style={tw`flex-row items-center gap-1.5`}>
                    <Calendar size={13} color="#6366F1" />
                    <Text style={[tw`text-[10px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
                      {t('Expected Arrival')}
                    </Text>
                  </View>
                  <DeliveryTimingBadge delivery={delivery} />
                </View>
                <Text style={[tw`font-semibold text-xs`, { color: colors.text }]}>
                  {formatExpectedDate(delivery.expected_date)}
                </Text>
              </View>

              <View
                style={[
                  tw`flex-1 p-3 rounded-xl border`,
                  {
                    backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                  <DollarSign size={13} color="#10B981" />
                  <Text style={[tw`text-[10px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
                    {t('Estimated Value')}
                  </Text>
                </View>
                <Text style={tw`text-emerald-500 font-bold text-xs`}>
                  {totalCost.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                </Text>
              </View>
            </View>

            {/* Items Header */}
            <View style={tw`flex-row items-center justify-between mb-3 mt-1`}>
              <View style={tw`flex-row items-center gap-2`}>
                <Package size={16} color={colors.textSecondary} />
                <Text style={[tw`font-bold text-sm tracking-wide`, { color: colors.text }]}>
                  {t('Expected Goods')} ({items.length})
                </Text>
              </View>
              <Text style={[tw`text-xs font-mono`, { color: colors.textMuted }]}>
                {totalUnits} {t('units total')}
              </Text>
            </View>

            {/* Items List */}
            {items.length === 0 ? (
              <View
                style={[
                  tw`py-8 items-center justify-center rounded-2xl border`,
                  { backgroundColor: isDark ? '#18181B' : '#F4F4F5', borderColor: colors.border },
                ]}
              >
                <Package size={32} color={colors.textMuted} />
                <Text style={[tw`text-xs mt-2 font-medium`, { color: colors.textSecondary }]}>
                  {t('No item breakdown registered for this PO.')}
                </Text>
              </View>
            ) : (
              <View style={tw`gap-2 mb-6`}>
                {items.map((item, idx) => {
                  const lineTotal = (item.cost_price_mt || 0) * (item.expected_quantity || 0);
                  const isVerified = item.received_quantity >= item.expected_quantity && item.received_quantity > 0;

                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        tw`p-3.5 rounded-xl border`,
                        {
                          backgroundColor: isDark ? '#18181B' : '#F4F4F5',
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={tw`flex-row items-start justify-between`}>
                        <View style={tw`flex-1 mr-2`}>
                          <Text style={[tw`font-semibold text-xs leading-4`, { color: colors.text }]}>
                            {item.name || `${t('Product ID:')} ${item.product_id}`}
                          </Text>
                          {item.barcode ? (
                            <View style={tw`flex-row items-center gap-1 mt-1`}>
                              <Barcode size={12} color={colors.textMuted} />
                              <Text style={[tw`text-[10px] font-mono`, { color: colors.textMuted }]}>
                                {item.barcode}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={tw`items-end`}>
                          <Text style={tw`text-emerald-500 font-bold text-xs`}>
                            {lineTotal.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                          </Text>
                          <Text style={[tw`text-[10px] mt-0.5`, { color: colors.textMuted }]}>
                            {item.cost_price_mt?.toFixed(2)} MT / {t('un')}
                          </Text>
                        </View>
                      </View>

                      {/* Quantity Progress */}
                      <View style={[tw`flex-row items-center justify-between mt-3 pt-2.5 border-t`, { borderTopColor: colors.border }]}>
                        <View style={tw`flex-row items-center gap-2`}>
                          <View
                            style={[
                              tw`px-2 py-0.5 rounded`,
                              { backgroundColor: isDark ? '#27272A' : '#E4E4E7' },
                            ]}
                          >
                            <Text style={[tw`font-mono text-[11px]`, { color: colors.textSecondary }]}>
                              {t('Expected:')} {item.expected_quantity}
                            </Text>
                          </View>
                          {item.received_quantity > 0 ? (
                            <View style={tw`bg-emerald-500/10 px-2 py-0.5 rounded`}>
                              <Text style={tw`text-emerald-500 font-mono text-[11px]`}>
                                {t('Received:')} {item.received_quantity}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {item.requires_verification ? (
                          <View style={tw`flex-row items-center gap-1`}>
                            {isVerified ? (
                              <CheckCircle2 size={13} color="#10B981" />
                            ) : (
                              <AlertTriangle size={13} color="#F59E0B" />
                            )}
                            <Text
                              style={tw`text-[10px] font-bold ${
                                isVerified ? 'text-emerald-500' : 'text-amber-500'
                              }`}
                            >
                              {isVerified ? t('VERIFIED') : t('NEEDS CHECK')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Action Buttons */}
            <View style={tw`gap-2.5 mt-2 mb-4`}>
              {!isReceived ? (
                <TouchableOpacity
                  style={tw`bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 rounded-xl flex-row items-center justify-center shadow-lg`}
                  onPress={handleMarkAsReceived}
                  disabled={updating}
                  activeOpacity={0.8}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" style={tw`mr-2`} />
                  ) : (
                    <CheckCircle2 size={18} color="#FFFFFF" style={tw`mr-2`} />
                  )}
                  <Text style={tw`text-white font-bold text-sm tracking-wide`}>
                    {updating ? t('Updating Status...') : t('Confirm Delivery Received')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={tw`bg-emerald-500/10 border border-emerald-500/20 py-3 px-4 rounded-xl flex-row items-center justify-center`}>
                  <CheckCircle2 size={16} color="#10B981" style={tw`mr-2`} />
                  <Text style={tw`text-emerald-500 font-bold text-xs tracking-wide`}>
                    {t('Shipment Officially Received & Stocked')}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  tw`border py-3 px-4 rounded-xl items-center justify-center`,
                  { backgroundColor: isDark ? '#18181B' : '#F4F4F5', borderColor: colors.border },
                ]}
                onPress={onClose}
              >
                <Text style={[tw`font-medium text-xs`, { color: colors.textSecondary }]}>{t('Close Details')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

