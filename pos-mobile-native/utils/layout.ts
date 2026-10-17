import { Platform, StatusBar, Dimensions } from 'react-native';
import Constants from 'expo-constants';

/**
 * Calculates accurate top safe-inset across all Android & iOS devices,
 * preventing cut-offs on tall ~7 inch screens with camera cutouts or punch-holes.
 */
export const getSafeTopPadding = (): number => {
  if (Platform.OS === 'android') {
    const androidStatus = StatusBar.currentHeight || 0;
    const expoStatus = Constants.statusBarHeight || 0;
    const measured = Math.max(androidStatus, expoStatus);
    // On devices with notches/punch-holes or immersive Android, ensure at least 28-32dp
    return measured > 0 ? measured : 32;
  }
  return Constants.statusBarHeight || 0;
};

/**
 * Returns whether the device has a tall display (e.g., 6.7" - 7" screens, 19.5:9 to 21:9 aspect ratios)
 */
export const isTallDevice = (): boolean => {
  const { height, width } = Dimensions.get('window');
  const screenHeight = Math.max(height, width);
  const screenWidth = Math.min(height, width);
  const ratio = screenHeight / screenWidth;
  return screenHeight >= 840 || ratio >= 2.0;
};

/**
 * Bottom safe inset recommendation for Android gesture bars & modern navigation
 */
export const getSafeBottomPadding = (): number => {
  if (Platform.OS === 'android') {
    return isTallDevice() ? 8 : 4;
  }
  return 12;
};
