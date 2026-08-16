import { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import type { Screen } from '@/types';
import { SplashScreen } from '@/screens/SplashScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ExploreScreen } from '@/screens/ExploreScreen';
import { MapScreen } from '@/screens/MapScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { StatisticsScreen } from '@/screens/StatisticsScreen';
import { PremiumScreen } from '@/screens/PremiumScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { LegalScreen } from '@/screens/LegalScreen';
import { CustomTabBar } from '@/components/CustomTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';

const TAB_SCREENS: Screen[] = ['home', 'explore', 'map', 'profile', 'settings'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [activeTab, setActiveTab] = useState<Screen>('home');

  const go = useCallback((next: Screen) => {
    setScreen(next);
    if (TAB_SCREENS.includes(next)) {
      setActiveTab(next);
    }
  }, []);

  const onTab = useCallback((tab: Screen) => {
    setScreen(tab);
    setActiveTab(tab);
  }, []);

  if (screen === 'splash') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onDone={() => setScreen('welcome')} />
      </SafeAreaProvider>
    );
  }

  if (screen === 'welcome') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <WelcomeScreen onNavigate={(s) => setScreen(s)} />
      </SafeAreaProvider>
    );
  }
  if (screen === 'login') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoginScreen onBack={() => setScreen('welcome')} onLogin={() => go('home')} onForgot={() => setScreen('forgot')} />
      </SafeAreaProvider>
    );
  }
  if (screen === 'register') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RegisterScreen onBack={() => setScreen('welcome')} onRegister={() => go('home')} />
      </SafeAreaProvider>
    );
  }
  if (screen === 'forgot') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ForgotPasswordScreen onBack={() => setScreen('login')} />
      </SafeAreaProvider>
    );
  }

  if (screen === 'terms' || screen === 'privacy') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.shell}>
          <LegalScreen
            title={screen === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            onBack={() => go('settings')}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  const isTabScreen = TAB_SCREENS.includes(screen);
  const showHeader = !isTabScreen;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        {showHeader && (
          <ScreenHeader
            title={screen === 'statistics' ? 'Statistics' : 'Premium'}
            onBack={() => go(activeTab === 'home' ? 'home' : 'home')}
          />
        )}
        <View style={styles.content}>
          {renderScreen(screen, go)}
        </View>
        <CustomTabBar activeTab={activeTab} onTab={onTab} />
      </View>
    </SafeAreaProvider>
  );
}

function renderScreen(screen: Screen, go: (s: Screen) => void) {
  switch (screen) {
    case 'home': return <HomeScreen onNavigate={go} />;
    case 'explore': return <ExploreScreen />;
    case 'map': return <MapScreen />;
    case 'profile': return <ProfileScreen onNavigate={go} />;
    case 'settings': return <SettingsScreen onNavigate={go} />;
    case 'statistics': return <StatisticsScreen />;
    case 'premium': return <PremiumScreen />;
    default: return null;
  }
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
});
