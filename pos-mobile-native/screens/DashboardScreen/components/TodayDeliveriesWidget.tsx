import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { Truck, Clock, ChevronRight, Package, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '../../../supabase';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface TodayDeliveriesWidgetProps {
  shopData: {
    id: string;
    name: string;
    code: string;
  };
  onViewDeliveries: () => void;
}

export default function TodayDeliveriesWidget({
  shopData,
  onViewDeliveries,
}: TodayDeliveriesWidgetProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [todayDeliveries, setTodayDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTodayDeliveries() {
      if (!shopData?.id) return;
      try {
        const { data, error } = await supabase
          .from('expected_deliveries')
          .select('id, po_number, supplier_name, expected_date, status')
          .eq('shop_id', shopData.id);

        if (!error && data) {
          const today = new Date();
          const filtered = data.filter((d: any) => {
            if (!d.expected_date) return false;
            const itemDate = new Date(d.expected_date);
            return (
              itemDate.getDate() === today.getDate() &&
              itemDate.getMonth() === today.getMonth() &&
              itemDate.getFullYear() === today.getFullYear()
            );
          });
          setTodayDeliveries(filtered);
        }
      } catch (err) {
        console.warn('TodayDeliveriesWidget fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTodayDeliveries();
  }, [shopData?.id]);

  const pendingToday = todayDeliveries.filter((d) => d.status !== 'received');
  const receivedToday = todayDeliveries.filter((d) => d.status === 'received');

  const getSubtitle = () => {
    if (pendingToday.length > 0) {
      return pendingToday.length > 1
        ? `${pendingToday.length} ${t('shipments expected to arrive today')}`
        : `1 ${t('shipment expected to arrive today')}`;
    }
    if (todayDeliveries.length > 0) {
      return t("All of today's shipments have been received");
    }
    return t('No supplier shipments scheduled for today');
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onViewDeliveries}
      style={[
        tw`rounded-2xl border p-4 mb-4`,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center gap-2.5 flex-1 mr-2`}>
          <View style={tw`w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center`}>
            <Truck size={18} color="#6366F1" />
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center gap-1.5`}>
              <Text style={[tw`font-bold text-sm tracking-tight`, { color: colors.text }]}>
                {t("Today's Expected Deliveries")}
              </Text>
              {todayDeliveries.length > 0 ? (
                <View style={tw`bg-indigo-500/20 px-1.5 py-0.5 rounded`}>
                  <Text style={tw`text-indigo-500 font-bold text-[9px]`}>
                    {todayDeliveries.length}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[tw`text-[11px] mt-0.5`, { color: colors.textSecondary }]}>
              {getSubtitle()}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row items-center gap-1`}>
          <Text style={tw`text-indigo-500 text-xs font-semibold`}>{t('Open')}</Text>
          <ChevronRight size={14} color="#6366F1" />
        </View>
      </View>

      {/* Mini snippet if deliveries exist */}
      {pendingToday.length > 0 ? (
        <View
          style={[
            tw`mt-3 pt-2.5 border-t flex-row items-center justify-between`,
            { borderTopColor: colors.border },
          ]}
        >
          <View style={tw`flex-row items-center gap-1.5 flex-1 mr-2`}>
            <Clock size={11} color={colors.textSecondary} />
            <Text style={[tw`text-xs font-medium`, { color: colors.text }]} numberOfLines={1}>
              {t('Next:')} {pendingToday[0].supplier_name} ({t('PO')} #{pendingToday[0].po_number})
            </Text>
          </View>
          <View style={tw`bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20`}>
            <Text style={tw`text-amber-500 text-[9px] font-bold uppercase`}>
              {t(pendingToday[0].status)}
            </Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
