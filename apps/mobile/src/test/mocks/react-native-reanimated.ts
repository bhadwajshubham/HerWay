// react-native-reanimated mock
const mockReanimated = {
  default: {
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ScrollView: 'ScrollView'
  },
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withTiming: (value: number) => value,
  withSpring: (value: number) => value,
  Easing: { linear: () => 1 }
};

export default mockReanimated;