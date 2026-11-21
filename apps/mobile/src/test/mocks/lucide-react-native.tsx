// lucide-react-native mock for testing
import { type FC } from 'react';

const createIcon = (): FC<{ size?: number; color?: string; strokeWidth?: number }> => (props) =>
  <div data-testid="icon" {...props} />;

// Export common icons used in the app
export const ArrowRight = createIcon();
export const ArrowLeft = createIcon();
export const Check = createIcon();
export const Phone = createIcon();
export const ShieldCheck = createIcon();
export const CalendarClock = createIcon();
export const MapPin = createIcon();
export const Send = createIcon();
export const ChevronRight = createIcon();
export const ActivityIndicator = createIcon();

export default createIcon;