import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
} from 'react-native';
import tw from 'twrnc';
import {
  Truck,
  Package,
  Calendar,
  Search,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { DeliveriesScreenProps, ExpectedDelivery, DeliveryStatus } from './types';
import DeliveryDetailsModal from './DeliveryDetailsModal';
import { DeliveryReceiptBadge, DeliveryTimingBadge } from './components/DeliveryBadges';
import { supabase } from '../../supabase';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../locales';
import { useTheme } from '../../theme';

export default function DeliveriesScreen({ shopData }: DeliveriesScreenProps) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const [deliveries, setDeliveries] = useState<ExpectedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'today' | 'pending' | 'received' | 'all'>('today');
  const [selectedDelivery, setSelectedDelivery] = useState<ExpectedDelivery | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { showToast } = useToast();

  // Load deliveries and their items from Supabase
  const loadDeliveries = useCallback(async () => {
    if (!shopData?.id) return;
    try {
      // 1. Fetch expected deliveries for this shop
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('expected_deliveries')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('expected_date', { ascending: true });

      if (deliveriesError) {
        // Table might not exist yet or empty
        console.warn('expected_deliveries fetch warning:', deliveriesError);
        setDeliveries([]);
        return;
      }

      if (!deliveriesData || deliveriesData.length === 0) {
        setDeliveries([]);
        return;
      }

      // 2. Fetch items for all these deliveries
      const deliveryIds = deliveriesData.map((d: any) => d.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('expected_delivery_items')
        .select('*')
        .in('delivery_id', deliveryIds);

      if (itemsError) {
        console.warn('expected_delivery_items fetch warning:', itemsError);
      }

      // 3. Map items to their deliveries
      const itemsByDelivery: Record<string, any[]> = {};
      (itemsData || []).forEach((item: any) => {
        if (!itemsByDelivery[item.delivery_id]) {
          itemsByDelivery[item.delivery_id] = [];
        }
        itemsByDelivery[item.delivery_id].push(item);
      });

      const formatted: ExpectedDelivery[] = deliveriesData.map((d: any) => {
        const dItems = itemsByDelivery[d.id] || [];
        const totalCost = dItems.reduce(
          (sum: number, i: any) => sum + (i.cost_price_mt || 0) * (i.expected_quantity || 0),
          0
        );
        return {
          ...d,
          items: dItems,
          items_count: dItems.length,
          total_cost_mt: totalCost,
        };
      });

      setDeliveries(formatted);
    } catch (err: any) {
      console.error('Error loading deliveries:', err);
      showToast(t('Could not load deliveries. Check your connection.'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopData?.id, showToast]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Real-time updates subscription
  useEffect(() => {
    if (!shopData?.id) return;

    const channel = supabase
      .channel(`realtime-deliveries-${shopData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expected_deliveries',
          filter: `shop_id=eq.${shopData.id}`,
        },
        () => {
          loadDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopData?.id, loadDeliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
  };

  // Helper to check if a delivery is today
  const isDeliveryToday = (expectedDate: string | null) => {
    if (!expectedDate) return false;
    const d = new Date(expectedDate);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Metrics computation
  const todayCount = useMemo(() => {
    return deliveries.filter((d) => isDeliveryToday(d.expected_date) && d.status !== 'received').length;
  }, [deliveries]);

  const pendingTotal = useMemo(() => {
    return deliveries.filter((d) => d.status !== 'received' && d.status !== 'cancelled').length;
  }, [deliveries]);

  const todayExpectedValue = useMemo(() => {
    return deliveries
      .filter((d) => isDeliveryToday(d.expected_date))
      .reduce((sum, d) => sum + (d.total_cost_mt || 0), 0);
  }, [deliveries]);

  // Filter & search logic
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((delivery) => {
      // Tab filter
      if (activeFilter === 'today') {
        if (!isDeliveryToday(delivery.expected_date)) return false;
      } else if (activeFilter === 'pending') {
        if (delivery.status === 'received' || delivery.status === 'cancelled') return false;
      } else if (activeFilter === 'received') {
        if (delivery.status !== 'received') return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchSupplier = delivery.supplier_name.toLowerCase().includes(q);
      const matchPo = delivery.po_number.toString().includes(q);
      const matchInv = delivery.invoice_number?.toLowerCase().includes(q);
      return matchSupplier || matchPo || matchInv;
    });
  }, [deliveries, activeFilter, searchQuery]);

  // Lazy loading pagination
  const PAGE_SIZE = 12;
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [activeFilter, searchQuery]);

  const visibleDeliveries = useMemo(() => {
    return filteredDeliveries.slice(0, displayCount);
  }, [filteredDeliveries, displayCount]);

  const handleLoadMore = () => {
    if (displayCount < filteredDeliveries.length) {
      setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredDeliveries.length));
    }
  };

  const handleDeliveryPress = (delivery: ExpectedDelivery) => {
    setSelectedDelivery(delivery);
    setModalVisible(true);
  };

  const getStatusLabel = (status: DeliveryStatus) => {
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

  const formatCardDate = (dateStr: string | null) => {
    if (!dateStr) return t('Date pending');
    const d = new Date(dateStr);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `${t('Today at')} ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${time}`;
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[tw`px-5 py-3.5 border-b`, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={tw`flex-row justify-between items-center`}>
          <View>
            <View style={tw`flex-row items-center gap-1.5`}>
              <View style={tw`w-2 h-2 rounded-full bg-emerald-500`} />
              <Text style={tw`text-[10px] font-bold text-indigo-500 tracking-wider uppercase`}>
                {t('INCOMING SHIPMENTS')}
              </Text>
            </View>
            <Text style={[tw`text-xl font-black mt-0.5 tracking-tight`, { color: colors.text }]}>
              {t('Expected Deliveries')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              tw`w-9 h-9 rounded-xl justify-center items-center border`,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[
            tw`mt-3 flex-row items-center rounded-xl border px-3 py-2`,
            { backgroundColor: isDark ? '#18181B' : '#F4F4F5', borderColor: colors.border },
          ]}
        >
          <Search size={15} color={colors.textMuted} style={tw`mr-2`} />
          <TextInput
            style={[tw`flex-1 text-xs p-0`, { color: colors.text }]}
            placeholder={t('Search supplier, PO number, invoice...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={tw`flex-1 px-4 pt-3.5`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Quick KPI Summary Row */}
        <View style={tw`flex-row gap-2.5 mb-4`}>
          <View style={[tw`flex-1 p-3 rounded-2xl border`, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
                {t('Today')}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-indigo-500/10 items-center justify-center`}>
                <Clock size={11} color="#6366F1" />
              </View>
            </View>
            <Text style={[tw`font-black text-lg mt-1`, { color: colors.text }]}>{todayCount}</Text>
            <Text style={[tw`text-[9px] mt-0.5`, { color: colors.textMuted }]}>{t('Scheduled today')}</Text>
          </View>

          <View style={[tw`flex-1 p-3 rounded-2xl border`, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
                {t('Pending')}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-amber-500/10 items-center justify-center`}>
                <Truck size={11} color="#F59E0B" />
              </View>
            </View>
            <Text style={tw`text-amber-500 font-black text-lg mt-1`}>{pendingTotal}</Text>
            <Text style={[tw`text-[9px] mt-0.5`, { color: colors.textMuted }]}>{t('Unreceived POs')}</Text>
          </View>

          <View style={[tw`flex-1 p-3 rounded-2xl border`, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] uppercase font-bold tracking-wider`, { color: colors.textSecondary }]}>
                {t('Value')}
              </Text>
              <View style={tw`w-5 h-5 rounded-full bg-emerald-500/10 items-center justify-center`}>
                <Package size={11} color="#10B981" />
              </View>
            </View>
            <Text style={tw`text-emerald-500 font-bold text-sm mt-1.5`} numberOfLines={1}>
              {todayExpectedValue > 0
                ? `${(todayExpectedValue / 1000).toFixed(1)}k MT`
                : '0 MT'}
            </Text>
            <Text style={[tw`text-[9px] mt-0.5`, { color: colors.textMuted }]}>{t('Arrivals today')}</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={tw`flex-row gap-2 mb-4`}>
          <TouchableOpacity
            style={[
              tw`px-3 py-1.5 rounded-full border`,
              activeFilter === 'today'
                ? tw`bg-indigo-600 border-indigo-500`
                : [{ backgroundColor: colors.card, borderColor: colors.border }],
            ]}
            onPress={() => setActiveFilter('today')}
          >
            <Text
              style={[
                tw`text-xs font-bold`,
                activeFilter === 'today' ? tw`text-white` : { color: colors.textSecondary },
              ]}
            >
              {t('Today')} {todayCount > 0 ? `(${todayCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`px-3 py-1.5 rounded-full border`,
              activeFilter === 'pending'
                ? tw`bg-indigo-600 border-indigo-500`
                : [{ backgroundColor: colors.card, borderColor: colors.border }],
            ]}
            onPress={() => setActiveFilter('pending')}
          >
            <Text
              style={[
                tw`text-xs font-bold`,
                activeFilter === 'pending' ? tw`text-white` : { color: colors.textSecondary },
              ]}
            >
              {t('All Pending')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`px-3 py-1.5 rounded-full border`,
              activeFilter === 'received'
                ? tw`bg-indigo-600 border-indigo-500`
                : [{ backgroundColor: colors.card, borderColor: colors.border }],
            ]}
            onPress={() => setActiveFilter('received')}
          >
            <Text
              style={[
                tw`text-xs font-bold`,
                activeFilter === 'received' ? tw`text-white` : { color: colors.textSecondary },
              ]}
            >
              {t('Received')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`px-3 py-1.5 rounded-full border`,
              activeFilter === 'all'
                ? tw`bg-indigo-600 border-indigo-500`
                : [{ backgroundColor: colors.card, borderColor: colors.border }],
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                tw`text-xs font-bold`,
                activeFilter === 'all' ? tw`text-white` : { color: colors.textSecondary },
              ]}
            >
              {t('All')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Deliveries List */}
        {loading ? (
          <View style={tw`py-12 items-center justify-center`}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={[tw`text-xs mt-3`, { color: colors.textSecondary }]}>{t('Checking expected shipments...')}</Text>
          </View>
        ) : filteredDeliveries.length === 0 ? (
          <View
            style={[
              tw`py-12 px-6 items-center justify-center rounded-2xl border my-2`,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Truck size={36} color={colors.textMuted} />
            <Text style={[tw`font-bold text-sm mt-3`, { color: colors.text }]}>
              {activeFilter === 'today'
                ? t('No deliveries expected today')
                : t('No deliveries found')}
            </Text>
            <Text style={[tw`text-xs text-center mt-1 max-w-[250px]`, { color: colors.textSecondary }]}>
              {activeFilter === 'today'
                ? t('All scheduled deliveries for today have been received, or none are booked on POS.')
                : t('Try adjusting your search or active filter tabs.')}
            </Text>
          </View>
        ) : (
          <View style={tw`gap-3 pb-8`}>
            {visibleDeliveries.map((delivery) => {
              const isToday = isDeliveryToday(delivery.expected_date);
              const isReceived = delivery.status === 'received';
              const itemCount = delivery.items?.length || delivery.items_count || 0;
              const totalCost = delivery.total_cost_mt || 0;

              return (
                <TouchableOpacity
                  key={delivery.id}
                  activeOpacity={0.7}
                  onPress={() => handleDeliveryPress(delivery)}
                  style={[
                    tw`rounded-2xl border p-4`,
                    {
                      backgroundColor: isToday && !isReceived
                        ? (isDark ? 'rgba(49, 46, 129, 0.2)' : 'rgba(99, 102, 241, 0.08)')
                        : colors.card,
                      borderColor: isToday && !isReceived
                        ? '#6366F1'
                        : colors.border,
                    },
                  ]}
                >
                  {/* Top Row: Supplier, PO number, and Status / Timing Badges */}
                  <View style={tw`flex-row items-start justify-between mb-2.5`}>
                    <View style={tw`flex-1 mr-2`}>
                      <View style={tw`flex-row items-center gap-1.5 flex-wrap`}>
                        <Text style={[tw`font-bold text-sm tracking-tight`, { color: colors.text }]} numberOfLines={1}>
                          {delivery.supplier_name}
                        </Text>
                      </View>
                      <Text style={[tw`text-xs font-mono mt-0.5`, { color: colors.textSecondary }]}>
                        PO #{delivery.po_number} {delivery.invoice_number ? `• Inv: ${delivery.invoice_number}` : ''}
                      </Text>
                    </View>

                    {/* Receipt Status Badge */}
                    <DeliveryReceiptBadge delivery={delivery} />
                  </View>

                  {/* Mid Row: Date and Timing Badge + Item count */}
                  <View style={[tw`flex-row items-center justify-between mt-1 pt-2.5 border-t`, { borderTopColor: colors.border }]}>
                    <View style={tw`flex-row items-center gap-2 flex-wrap`}>
                      <DeliveryTimingBadge delivery={delivery} />
                      <Text style={[tw`text-xs font-mono`, { color: colors.textSecondary }]}>
                        {formatCardDate(delivery.expected_date)}
                      </Text>
                    </View>

                    <View style={tw`flex-row items-center gap-1`}>
                      <Package size={12} color={colors.textSecondary} />
                      <Text style={[tw`text-xs`, { color: colors.textSecondary }]}>
                        {itemCount} {itemCount === 1 ? t('product') : t('products')}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Row: Cost and View Details Chevron */}
                  <View style={[tw`flex-row items-center justify-between mt-2.5 pt-2 border-t`, { borderTopColor: colors.border }]}>
                    <View>
                      <Text style={[tw`text-[10px] uppercase font-semibold`, { color: colors.textMuted }]}>
                        {t('Total Estimated Cost')}
                      </Text>
                      <Text style={tw`text-emerald-500 font-bold text-xs mt-0.5`}>
                        {totalCost > 0
                          ? `${totalCost.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`
                          : t('Pending calculation')}
                      </Text>
                    </View>

                    <View style={tw`flex-row items-center gap-1`}>
                      <Text style={tw`text-indigo-500 text-xs font-semibold`}>{t('View Items')}</Text>
                      <ChevronRight size={14} color="#6366F1" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Lazy loading "Load More" indicator */}
            {displayCount < filteredDeliveries.length && (
              <TouchableOpacity
                style={[
                  tw`border py-3 rounded-xl items-center justify-center mt-2 mb-2`,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={handleLoadMore}
                activeOpacity={0.7}
              >
                <Text style={tw`text-indigo-500 text-xs font-bold`}>
                  {t('Load More')} ({visibleDeliveries.length} / {filteredDeliveries.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Details Modal */}
      <DeliveryDetailsModal
        visible={modalVisible}
        delivery={selectedDelivery}
        onClose={() => setModalVisible(false)}
        onStatusUpdated={(updated) => {
          setDeliveries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setSelectedDelivery(updated);
        }}
      />
    </View>
  );
}
