import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  distance?: number;
  scale?: boolean;
  style?: import('react-native').ViewProps['style'];
}

export function FadeIn({ children, delay = 0, distance = 20, scale = false, style }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  const scaleValue = useRef(new Animated.Value(scale ? 0.95 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ...(scale ? [Animated.timing(scaleValue, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.ease), useNativeDriver: true })] : []),
    ]).start();
  }, [delay, distance, scale, opacity, translateY, scaleValue]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }, { scale: scaleValue }] }, style]}>
      {children}
    </Animated.View>
  );
}
