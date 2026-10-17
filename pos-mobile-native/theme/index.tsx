import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  card: string;
  cardSecondary: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
}

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

const darkColors: ThemeColors = {
  bg: '#09090B',
  card: '#18181B',
  cardSecondary: '#121215',
  border: '#27272A',
  borderSubtle: '#3F3F46',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  inputBg: '#121215',
};

const lightColors: ThemeColors = {
  bg: '#F4F4F5',
  card: '#FFFFFF',
  cardSecondary: '#FAFAFA',
  border: '#E4E4E7',
  borderSubtle: '#D4D4D8',
  text: '#09090B',
  textSecondary: '#52525B',
  textMuted: '#71717A',
  inputBg: '#F4F4F5',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  colors: darkColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme_mode');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
      } catch (e) {
        // ignore fallback to dark
      }
    })();
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem('app_theme_mode', mode).catch(() => {});
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Unified POS Design System & Palette (For Mobile Companion)
export const POS_THEME = {
  colors: {
    // Primary Accent Palette (Modern Indigo / Violet)
    brandPrimary: '#4F46E5', // indigo-600 — primary action buttons, checkout highlights, active tabs
    brandLight: '#6366F1',   // indigo-500
    brandDark: '#4338CA',    // indigo-700
    brandTint: 'rgba(79, 70, 229, 0.15)', // dark mode indigo-950/50
    brandBorder: 'rgba(79, 70, 229, 0.35)',

    // Status & Mozambican Payment Accents
    // Success / Cash / Online
    success: '#10B981',       // emerald-500
    successDark: '#059669',   // emerald-600
    successTint: 'rgba(16, 185, 129, 0.12)',
    successBorder: 'rgba(16, 185, 129, 0.3)',

    // Warning / Fiados / Subscription Pending
    warning: '#F59E0B',       // amber-500
    warningDark: '#D97706',   // amber-600
    warningTint: 'rgba(245, 158, 11, 0.12)',
    warningBorder: 'rgba(245, 158, 11, 0.3)',

    // M-Pesa Red (Standard Vodacom M-Pesa red)
    mpesaRed: '#DC2626',      // red-600
    mpesaTint: 'rgba(220, 38, 38, 0.15)',
    mpesaBorder: 'rgba(220, 38, 38, 0.35)',

    // E-Mola Gold/Orange (Movitel E-Mola)
    emolaGold: '#F59E0B',     // amber-500
    emolaTint: 'rgba(245, 158, 11, 0.15)',
    emolaBorder: 'rgba(245, 158, 11, 0.35)',

    // Pro Tier Crown / Royal Gold
    proGold: '#F59E0B',

    // Surfaces & Canvas (Dark Mode)
    canvas: '#09090B',        // zinc-950 (Dark mode canvas)
    card: '#18181B',          // zinc-900 (Dark mode cards/containers)
    cardSecondary: '#27272A', // zinc-800
    border: '#27272A',        // zinc-800 (Card and container borders)
    borderSubtle: '#18181B',  // zinc-900

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA', // zinc-400
    textMuted: '#71717A',     // zinc-500
    textDim: '#52525B',       // zinc-600
  },
  radii: {
    card: 'rounded-2xl',      // 16px
    cardLarge: 'rounded-3xl', // 24px
    button: 'rounded-xl',     // 12px
    buttonLarge: 'rounded-2xl', // 16px
    badge: 'rounded-full',
    badgePill: 'rounded-xl',
  },
};
