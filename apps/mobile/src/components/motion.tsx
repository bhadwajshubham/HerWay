import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const ENTER_EASING = Easing.bezier(0.22, 1, 0.36, 1);

export function FadeIn({
  children,
  delay = 0,
  duration = 420,
  translateY = 14,
  style
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: ENTER_EASING })
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * translateY }]
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function PopIn({
  children,
  delay = 0,
  style
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 16, stiffness: 180, mass: 0.9 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 260, easing: ENTER_EASING }));
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function Pulse({
  children,
  style
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      scale.value = withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }, () => {
        scale.value = withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }, loop);
      });
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
