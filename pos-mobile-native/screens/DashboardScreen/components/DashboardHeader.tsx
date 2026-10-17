import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { RefreshCw, LogOut, Sun, Moon, SunMedium } from 'lucide-react-native';
import tw from 'twrnc';
import { ShopData } from '../types';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';
import LanguageSelectorModal from '../../../components/LanguageSelectorModal';

interface DashboardHeaderProps {
  shopData: ShopData;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  shopData,
  onRefresh,
  onLogout,
}: DashboardHeaderProps) {
  const { t, currentLanguageOption } = useLanguage();
  const { isDark, toggleTheme, colors } = useTheme();
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Time-of-day greeting & icon
  const currentHour = new Date().getHours();
  let greeting = t('Good Morning');
  let GreetingIcon = Sun;
  let iconColor = '#F59E0B'; // Amber / Gold for morning

  if (currentHour >= 12 && currentHour < 18) {
    greeting = t('Good Afternoon');
    GreetingIcon = SunMedium;
    iconColor = '#F97316'; // Warm orange for afternoon
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = t('Good Evening');
    GreetingIcon = Moon;
    iconColor = '#818CF8'; // Indigo / Violet for night
  }

  const handleLogoutPress = () => {
    Alert.alert(
      t('Logout'),
      t('Are you sure you want to log out from this store?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Logout'), style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <View
      style={[
        tw`flex-row justify-between items-center px-4 py-3 border-b`,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={tw`flex-1 mr-2`}>
        <View style={tw`flex-row items-center gap-1.5 flex-wrap`}>
          <View style={tw`w-1.5 h-1.5 rounded-full bg-[#10B981]`} />
          <Text style={tw`text-[9px] font-bold text-[#6366F1] tracking-wider uppercase`}>
            {t('EXECUTIVE OVERVIEW')}
          </Text>
          <View style={tw`bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.2 rounded-full`}>
            <Text style={tw`text-[8px] font-black text-indigo-400 uppercase tracking-wider`}>
              {t('PRO PLAN')}
            </Text>
          </View>
        </View>

        {/* Dynamic greeting with shop name and day/night icon */}
        <View style={tw`flex-row items-center gap-1.5 mt-0.5`}>
          <Text
            style={[
              tw`text-base font-bold tracking-tight uppercase flex-shrink`,
              { color: colors.text },
            ]}
            numberOfLines={1}
          >
            {`${greeting}, ${shopData.name}`}
          </Text>
          <GreetingIcon size={16} color={iconColor} />
        </View>
      </View>

      <View style={tw`flex-row items-center gap-1.5`}>
        {/* Theme Toggle Button (Light/Dark Mode) */}
        <TouchableOpacity
          style={[
            tw`w-9 h-9 rounded-xl justify-center items-center border`,
            {
              backgroundColor: isDark ? '#27272A' : '#F4F4F5',
              borderColor: colors.border,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityLabel={isDark ? t('Switch to Light Mode') : t('Switch to Dark Mode')}
        >
          {isDark ? (
            <Sun size={15} color="#F59E0B" />
          ) : (
            <Moon size={15} color="#6366F1" />
          )}
        </TouchableOpacity>

        {/* Language Switcher Pill */}
        <TouchableOpacity
          style={[
            tw`flex-row items-center gap-1 px-2.5 h-9 rounded-xl border`,
            {
              backgroundColor: isDark ? '#18181B' : '#F4F4F5',
              borderColor: colors.border,
            },
          ]}
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={tw`text-xs`}>{currentLanguageOption.flag}</Text>
          <Text style={tw`text-[11px] font-black text-indigo-500 uppercase`}>
            {currentLanguageOption.code}
          </Text>
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity
          style={[
            tw`w-9 h-9 rounded-xl justify-center items-center border`,
            {
              backgroundColor: isDark ? '#18181B' : '#F4F4F5',
              borderColor: colors.border,
            },
          ]}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <RefreshCw size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={tw`w-9 h-9 rounded-xl bg-red-500/10 justify-center items-center border border-red-500/20`}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <LogOut size={14} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
}

