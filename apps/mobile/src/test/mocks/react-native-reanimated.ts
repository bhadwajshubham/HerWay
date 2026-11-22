// react-native-reanimated mock
const easing = {
  bezier: () => (value: number) => value,
  inOut: (fn: unknown) => fn,
  ease: (value: number) => value
};

const mockReanimated = {
  default: {
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ScrollView: 'ScrollView'
  },
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: () => ({}),
  withTiming: (value: number) => value,
  withSpring: (value: number) => value,
  withDelay: (_delay: number, value: unknown) => value,
  Easing: easing
};

export default mockReanimated;
