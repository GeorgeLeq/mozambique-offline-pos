import React from 'react';
import { View, ViewStyle, StatusBar } from 'react-native';
import tw from 'twrnc';
import { getSafeTopPadding } from '../utils/layout';
import { useTheme } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withTopInset?: boolean;
}

export default function ScreenContainer({
  children,
  style,
  withTopInset = true,
}: ScreenContainerProps) {
  const { isDark, colors } = useTheme();
  const topPadding = withTopInset ? getSafeTopPadding() : 0;

  return (
    <View
      style={[
        { flex: 1, backgroundColor: colors.bg, paddingTop: topPadding },
        style,
      ]}
    >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.bg} 
        translucent={false} 
      />
      {children}
    </View>
  );
}

