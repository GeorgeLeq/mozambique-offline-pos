import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { CheckCircle2, Clock, AlertTriangle, Calendar, XCircle, Truck } from 'lucide-react-native';
import { ExpectedDelivery } from '../types';
import { useLanguage } from '../../../locales';

export type ReceiptStatusType = 'fully_received' | 'partially_received' | 'in_transit' | 'pending' | 'cancelled';
export type TimingStatusType = 'on_time' | 'late_arrival' | 'delayed' | 'today' | 'upcoming' | 'no_date';

export function getDeliveryReceiptInfo(delivery: ExpectedDelivery): {
  type: ReceiptStatusType;
  labelKey: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  percentage?: number;
} {
  if (delivery.status === 'cancelled') {
    return {
      type: 'cancelled',
      labelKey: 'Cancelled',
      bgClass: 'bg-zinc-500/15',
      borderClass: 'border-zinc-500/30',
      textClass: 'text-zinc-400',
      dotColor: '#71717A',
      icon: XCircle,
    };
  }

  const items = delivery.items || [];
  const totalExpected = items.reduce((sum, item) => sum + (Number(item.expected_quantity) || 0), 0);
  const totalReceived = items.reduce((sum, item) => sum + (Number(item.received_quantity) || 0), 0);

  if (delivery.status === 'received' || (items.length > 0 && totalExpected > 0 && totalReceived >= totalExpected)) {
    return {
      type: 'fully_received',
      labelKey: 'Fully Received',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/30',
      textClass: 'text-emerald-500',
      dotColor: '#10B981',
      icon: CheckCircle2,
      percentage: 100,
    };
  }

  if (totalReceived > 0 && totalReceived < totalExpected) {
    const pct = Math.round((totalReceived / totalExpected) * 100);
    return {
      type: 'partially_received',
      labelKey: 'Partially Received',
      bgClass: 'bg-amber-500/15',
      borderClass: 'border-amber-500/30',
      textClass: 'text-amber-500',
      dotColor: '#F59E0B',
      icon: Clock,
      percentage: pct,
    };
  }

  if (delivery.status === 'in_transit') {
    return {
      type: 'in_transit',
      labelKey: 'In Transit',
      bgClass: 'bg-sky-500/15',
      borderClass: 'border-sky-500/30',
      textClass: 'text-sky-500',
      dotColor: '#0EA5E9',
      icon: Truck,
      percentage: 0,
    };
  }

  return {
    type: 'pending',
    labelKey: 'Pending',
    bgClass: 'bg-orange-500/15',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-500',
    dotColor: '#F97316',
    icon: Clock,
    percentage: 0,
  };
}

export function getDeliveryTimingInfo(delivery: ExpectedDelivery): {
  type: TimingStatusType;
  labelKey: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconColor: string;
  icon: React.ComponentType<{ size: number; color: string }>;
} {
  if (!delivery.expected_date) {
    return {
      type: 'no_date',
      labelKey: 'No Date',
      bgClass: 'bg-zinc-500/10',
      borderClass: 'border-zinc-500/20',
      textClass: 'text-zinc-400',
      iconColor: '#71717A',
      icon: Calendar,
    };
  }

  const exp = new Date(delivery.expected_date);
  const now = new Date();

  const expMidnight = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const isReceived = delivery.status === 'received';

  if (isReceived) {
    const updated = delivery.updated_at ? new Date(delivery.updated_at) : now;
    const updatedMidnight = new Date(updated.getFullYear(), updated.getMonth(), updated.getDate()).getTime();

    if (updatedMidnight > expMidnight) {
      return {
        type: 'late_arrival',
        labelKey: 'Late Arrival',
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-500/30',
        textClass: 'text-amber-500',
        iconColor: '#F59E0B',
        icon: AlertTriangle,
      };
    }
    return {
      type: 'on_time',
      labelKey: 'On Time',
      bgClass: 'bg-emerald-500/15',
      borderClass: 'border-emerald-500/30',
      textClass: 'text-emerald-500',
      iconColor: '#10B981',
      icon: CheckCircle2,
    };
  }

  // Pending / In Transit Deliveries
  if (expMidnight < todayMidnight) {
    return {
      type: 'delayed',
      labelKey: 'Delayed',
      bgClass: 'bg-red-500/15',
      borderClass: 'border-red-500/30',
      textClass: 'text-red-500',
      iconColor: '#EF4444',
      icon: AlertTriangle,
    };
  }

  if (expMidnight === todayMidnight) {
    return {
      type: 'today',
      labelKey: 'Arriving Today',
      bgClass: 'bg-indigo-500/15',
      borderClass: 'border-indigo-500/30',
      textClass: 'text-indigo-500',
      iconColor: '#6366F1',
      icon: Clock,
    };
  }

  return {
    type: 'upcoming',
    labelKey: 'Upcoming',
    bgClass: 'bg-blue-500/15',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-500',
    iconColor: '#3B82F6',
    icon: Calendar,
  };
}

interface DeliveryReceiptBadgeProps {
  delivery: ExpectedDelivery;
  compact?: boolean;
}

export function DeliveryReceiptBadge({ delivery, compact = false }: DeliveryReceiptBadgeProps) {
  const { t } = useLanguage();
  const info = getDeliveryReceiptInfo(delivery);
  const IconComponent = info.icon;

  return (
    <View
      style={tw`flex-row items-center gap-1.5 px-2.5 py-0.8 rounded-full border ${info.bgClass} ${info.borderClass}`}
    >
      <View style={[tw`w-1.5 h-1.5 rounded-full`, { backgroundColor: info.dotColor }]} />
      <Text style={tw`text-[10px] font-bold uppercase tracking-wider ${info.textClass}`}>
        {t(info.labelKey)}
        {info.type === 'partially_received' && info.percentage !== undefined ? ` (${info.percentage}%)` : ''}
      </Text>
    </View>
  );
}

interface DeliveryTimingBadgeProps {
  delivery: ExpectedDelivery;
  compact?: boolean;
}

export function DeliveryTimingBadge({ delivery, compact = false }: DeliveryTimingBadgeProps) {
  const { t } = useLanguage();
  const info = getDeliveryTimingInfo(delivery);
  const IconComponent = info.icon;

  return (
    <View
      style={tw`flex-row items-center gap-1 px-2 py-0.8 rounded-md border ${info.bgClass} ${info.borderClass}`}
    >
      <IconComponent size={11} color={info.iconColor} />
      <Text style={tw`text-[10px] font-bold ${info.textClass}`}>
        {t(info.labelKey)}
      </Text>
    </View>
  );
}
