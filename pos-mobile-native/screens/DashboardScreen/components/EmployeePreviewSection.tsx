import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import {
  Users,
  MessageCircle,
  Shield,
  ShieldOff,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import tw from 'twrnc';
import { Employee } from '../types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface EmployeePreviewSectionProps {
  employees: Employee[];
  onViewAllEmployees: () => void;
  onToggleEmployeeBlock: (employeeId: string, currentStatus: boolean) => void;
}

export default function EmployeePreviewSection({
  employees,
  onViewAllEmployees,
  onToggleEmployeeBlock,
}: EmployeePreviewSectionProps) {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();

  const formatTime = (isoString?: string) => {
    if (!isoString) return t('Not logged in');
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleWhatsApp = (phone: string, name: string) => {
    if (!phone) return;
    const message = `Olá ${name}, `;
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
  };

  const handleBlockPress = (employee: Employee) => {
    const isCurrentlyBlocked = !!employee.is_blocked;
    if (isCurrentlyBlocked) {
      Alert.alert(
        t('Unblock Cashier'),
        t('Are you sure you want to unblock this cashier?'),
        [
          { text: t('Cancel'), style: 'cancel' },
          {
            text: t('Unblock'),
            onPress: () => onToggleEmployeeBlock(employee.id, isCurrentlyBlocked),
          },
        ]
      );
    } else {
      Alert.alert(
        t('Block Cashier'),
        t('Are you sure you want to block this cashier? They will be signed out from the POS immediately.'),
        [
          { text: t('Cancel'), style: 'cancel' },
          {
            text: t('Block'),
            style: 'destructive',
            onPress: () => onToggleEmployeeBlock(employee.id, isCurrentlyBlocked),
          },
        ]
      );
    }
  };

  return (
    <View style={tw`mb-8`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-3 px-1`}>
        <View style={tw`flex-row items-center gap-2`}>
          <Users size={16} color={colors.textSecondary} />
          <Text style={[tw`text-xs font-semibold tracking-wider uppercase`, { color: colors.text }]}>
            {t('Remote Cashier Management')}
          </Text>
        </View>
        <TouchableOpacity onPress={onViewAllEmployees}>
          <Text style={tw`text-xs font-bold text-[#6366F1]`}>{t('Manage All')}</Text>
        </TouchableOpacity>
      </View>

      {/* Employee List or Empty State */}
      {employees.length === 0 ? (
        <View
          style={[
            tw`rounded-2xl border p-6 items-center justify-center`,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[tw`text-xs text-center`, { color: colors.textSecondary }]}>
            {t('No cashiers registered for this shop.')}
          </Text>
        </View>
      ) : (
        <View>
          {employees.slice(0, 3).map((employee) => (
            <View
              key={employee.id}
              style={[
                tw`rounded-2xl border p-4 mb-3`,
                {
                  backgroundColor: colors.card,
                  borderColor: employee.is_blocked
                    ? 'rgba(239, 68, 68, 0.4)'
                    : colors.border,
                },
              ]}
            >
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <Text style={[tw`text-sm font-bold`, { color: colors.text }]}>
                      {employee.name}
                    </Text>
                    {employee.is_blocked ? (
                      <View style={tw`bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/30`}>
                        <Text style={tw`text-[8px] font-bold text-red-500 uppercase`}>
                          {t('Blocked')}
                        </Text>
                      </View>
                    ) : (
                      <View style={tw`bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30`}>
                        <Text style={tw`text-[8px] font-bold text-[#10B981] uppercase`}>
                          {t('Active')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[tw`text-[10px] mt-1 uppercase tracking-wider`, { color: colors.textSecondary }]}>
                    {t(employee.role || 'Cashier')}
                  </Text>
                </View>

                <View style={tw`flex-row items-center gap-2.5`}>
                  {employee.phone_number ? (
                    <TouchableOpacity
                      style={tw`w-9 h-9 rounded-xl bg-[#25D366]/15 justify-center items-center border border-[#25D366]/30`}
                      onPress={() =>
                        handleWhatsApp(employee.phone_number!, employee.name)
                      }
                    >
                      <MessageCircle size={16} color="#25D366" />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={tw`w-14 h-9 rounded-xl justify-center items-center ${
                      employee.is_blocked
                        ? 'bg-emerald-500/15 border border-emerald-500/30'
                        : 'bg-red-500/15 border border-red-500/30'
                    }`}
                    onPress={() => handleBlockPress(employee)}
                  >
                    {employee.is_blocked ? (
                      <Shield size={14} color="#10B981" />
                    ) : (
                      <ShieldOff size={14} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={[
                  tw`rounded-lg p-2 flex-row items-center gap-2 border`,
                  {
                    backgroundColor: isDark ? '#0F0F12' : '#F4F4F5',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Clock
                  size={12}
                  color={employee.current_shift_start ? '#10B981' : colors.textSecondary}
                />
                {employee.current_shift_start ? (
                  <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>
                    {t('Logged in since ')}
                    <Text style={[tw`font-mono font-bold`, { color: colors.text }]}>
                      {formatTime(employee.current_shift_start)}
                    </Text>
                  </Text>
                ) : (
                  <Text style={[tw`text-[10px]`, { color: colors.textSecondary }]}>
                    {t('Currently offline')}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {employees.length > 3 ? (
            <TouchableOpacity
              style={[
                tw`flex-row items-center justify-center gap-2 py-3 rounded-xl mt-1 border`,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={onViewAllEmployees}
            >
              <Text style={[tw`text-xs font-semibold uppercase tracking-widest`, { color: colors.textSecondary }]}>
                {`${t('View All')} (${employees.length}) ${t('Employees')}`}
              </Text>
              <ChevronRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}
