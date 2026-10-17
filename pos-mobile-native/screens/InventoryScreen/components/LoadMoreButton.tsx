import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import tw from 'twrnc';
import { useLanguage } from '../../../locales';
import { useTheme } from '../../../theme';

interface LoadMoreButtonProps {
  hasMore: boolean;
  loadingMore: boolean;
  remainingCount: number;
  onLoadMore: () => void;
}

export default function LoadMoreButton({
  hasMore,
  loadingMore,
  remainingCount,
  onLoadMore,
}: LoadMoreButtonProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  if (!hasMore) {
    return (
      <View style={tw`py-6 items-center justify-center`}>
        <Text style={[tw`text-[11px] uppercase tracking-wider`, { color: colors.textSecondary }]}>
          {t('All products loaded')}
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`py-4 mb-8`}>
      <TouchableOpacity
        style={[
          tw`border border-[#4F46E5]/40 active:bg-[#4F46E5]/10 rounded-2xl py-3.5 px-4 flex-row items-center justify-center gap-2`,
          { backgroundColor: colors.card },
        ]}
        onPress={onLoadMore}
        disabled={loadingMore}
        activeOpacity={0.7}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color="#4F46E5" />
        ) : (
          <>
            <ChevronDown size={16} color="#6366F1" />
            <Text style={tw`text-xs font-bold text-[#6366F1] uppercase tracking-wider`}>
              {`${t('Load More')} (${remainingCount} ${t('remaining')})`}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}


