import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SPRING_CONFIG = {
  mass: 1,
  damping: 20,
  stiffness: 200
} as const;

export type SpringPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SpringPressable({ style, onPressIn, onPressOut, ...props }: SpringPressableProps) {
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const resolvedStyle = typeof style === 'function' ? style({ pressed }) : style;

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        setPressed(true);
        scale.value = withSpring(0.95, SPRING_CONFIG);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        scale.value = withSpring(1, SPRING_CONFIG);
        onPressOut?.(event);
      }}
      style={[resolvedStyle, animatedStyle]}
    />
  );
}
