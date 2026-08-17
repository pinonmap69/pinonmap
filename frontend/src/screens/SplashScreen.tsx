import { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet } from 'react-native';
import { Compass } from 'lucide-react-native';
import { SPLASH_IMAGE } from '@/theme';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -12, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone, opacity, translateY, float]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bgWrap, { opacity }]}>
        <Image source={{ uri: SPLASH_IMAGE }} style={styles.bgImage} resizeMode="cover" />
        <View style={styles.overlay} />
      </Animated.View>
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Animated.View style={{ transform: [{ translateY: float }] }}>
          <View style={styles.logoWrap}><Compass size={40} color="#fff" strokeWidth={2.5} /></View>
        </Animated.View>
        <Text style={styles.title}>Pin on Map</Text>
        <Text style={styles.subtitle}>Pin your favorite places on the map</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  bgWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bgImage: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.55)' },
  content: { alignItems: 'center' },
  logoWrap: { width: 80, height: 80, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  subtitle: { marginTop: 8, fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
});
