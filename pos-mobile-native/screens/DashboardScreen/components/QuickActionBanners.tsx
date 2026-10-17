import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Radio, Key } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface QuickActionBannersProps {
  activeTokensCount: number;
  onOpenAnnouncementModal: () => void;
  onOpenEmployeeManagement: () => void;
}

export default function QuickActionBanners({
  activeTokensCount,
  onOpenAnnouncementModal,
  onOpenEmployeeManagement,
}: QuickActionBannersProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={tw`gap-2.5 mb-3`}>
      {/* Broadcast Notice to POS */}
      <TouchableOpacity
        style={[
          tw`border border-[#4F46E5]/35 rounded-2xl p-3.5 flex-row items-center justify-between`,
          { backgroundColor: colors.card },
        ]}
        onPress={onOpenAnnouncementModal}
        activeOpacity={0.8}
      >
        <View style={tw`flex-row items-center gap-3 flex-1 mr-2`}>
          <View style={tw`w-9 h-9 rounded-xl bg-[#4F46E5]/15 border border-[#4F46E5]/30 justify-center items-center`}>
            <Radio size={18} color="#6366F1" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={[tw`text-xs font-bold`, { color: colors.text }]}>{t('Broadcast Notice to POS')}</Text>
            <Text style={[tw`text-[10px] mt-0.5`, { color: colors.textSecondary }]}>
              {t('Instant 1-way flash announcement to cashier screens')}
            </Text>
          </View>
        </View>
        <View style={tw`bg-[#4F46E5] px-3 py-1.5 rounded-xl`}>
          <Text style={tw`text-[10px] font-bold text-white uppercase tracking-wider`}>{t('Send')}</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Emergency PIN Banner */}
      <TouchableOpacity
        style={[
          tw`border border-[#F59E0B]/35 rounded-2xl p-3.5 flex-row items-center justify-between`,
          { backgroundColor: colors.card },
        ]}
        onPress={onOpenEmployeeManagement}
        activeOpacity={0.8}
      >
        <View style={tw`flex-row items-center gap-3 flex-1 mr-2`}>
          <View style={tw`w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 justify-center items-center`}>
            <Key size={18} color="#F59E0B" />
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={[tw`text-xs font-bold`, { color: colors.text }]}>{t('Emergency One-Time PINs')}</Text>
              {activeTokensCount > 0 ? (
                <View style={tw`bg-[#F59E0B]/20 px-1.5 py-0.5 rounded-full border border-[#F59E0B]/40`}>
                  <Text style={tw`text-[8px] font-bold text-[#F59E0B]`}>
                    {`${activeTokensCount} ${t('Active')}`}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[tw`text-[10px] mt-0.5`, { color: colors.textSecondary }]}>
              {t('Generate single-use authorization PINs for cashiers')}
            </Text>
          </View>
        </View>
        <View style={tw`bg-[#D97706] px-3 py-1.5 rounded-xl`}>
          <Text style={tw`text-[10px] font-bold text-white uppercase tracking-wider`}>{t('Issue PIN')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

