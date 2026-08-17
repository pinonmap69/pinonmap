import { useState, useCallback } from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import type { Screen, Tab, NavParams } from '@/types';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { NavContext, useNav } from '@/navigation/nav';
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
import { AddPlaceScreen } from '@/screens/AddPlaceScreen';
import { PlaceDetailScreen } from '@/screens/PlaceDetailScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { CustomTabBar } from '@/components/CustomTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';

const TAB_SCREENS: Screen[] = ['home', 'explore', 'map', 'profile', 'settings'];

const HEADER_TITLES: Partial<Record<Screen, string>> = {
  statistics: 'Statystyki',
  premium: 'Premium',
  addPlace: 'Dodaj miejsce',
  placeDetail: 'Szczegóły miejsca',
  editProfile: 'Edytuj profil',
};

type AuthScreen = 'welcome' | 'login' | 'register' | 'forgot' | 'terms' | 'privacy';

function AuthFlow() {
  const [screen, setScreen] = useState<AuthScreen>('welcome');

  if (screen === 'login') {
    return <LoginScreen onBack={() => setScreen('welcome')} onForgot={() => setScreen('forgot')} onGoRegister={() => setScreen('register')} />;
  }
  if (screen === 'register') {
    return <RegisterScreen onBack={() => setScreen('welcome')} onGoLogin={() => setScreen('login')} />;
  }
  if (screen === 'forgot') {
    return <ForgotPasswordScreen onBack={() => setScreen('login')} />;
  }
  if (screen === 'terms' || screen === 'privacy') {
    return (
      <View style={styles.shell}>
        <LegalScreen title={screen === 'terms' ? 'Regulamin' : 'Polityka prywatności'} onBack={() => setScreen('welcome')} />
      </View>
    );
  }
  return <WelcomeScreen onNavigate={(s) => setScreen(s as AuthScreen)} />;
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [stack, setStack] = useState<{ screen: Screen; params: NavParams }[]>([{ screen: 'home', params: {} }]);
  const current = stack[stack.length - 1];

  const navigate = useCallback((screen: Screen, params: NavParams = {}) => {
    if (TAB_SCREENS.includes(screen)) {
      setActiveTab(screen as Tab);
      setStack([{ screen, params }]);
    } else {
      setStack((s) => [...s, { screen, params }]);
    }
  }, []);

  const goBack = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const onTab = useCallback((tab: Screen) => {
    setActiveTab(tab as Tab);
    setStack([{ screen: tab, params: {} }]);
  }, []);

  const isTab = TAB_SCREENS.includes(current.screen);
  const noShellHeader = current.screen === 'terms' || current.screen === 'privacy';

  return (
    <NavContext.Provider value={{ navigate, goBack, params: current.params }}>
      <View style={styles.shell}>
        {!isTab && !noShellHeader && <ScreenHeader title={HEADER_TITLES[current.screen] ?? ''} onBack={goBack} />}
        <View style={styles.content}>{renderAppScreen(current.screen)}</View>
        {isTab && <CustomTabBar activeTab={activeTab} onTab={onTab} />}
      </View>
    </NavContext.Provider>
  );
}

function LegalRoute({ title }: { title: string }) {
  const { goBack } = useNav();
  return <LegalScreen title={title} onBack={goBack} />;
}

function renderAppScreen(screen: Screen) {
  switch (screen) {
    case 'home': return <HomeScreen />;
    case 'explore': return <ExploreScreen />;
    case 'map': return <MapScreen />;
    case 'profile': return <ProfileScreen />;
    case 'settings': return <SettingsScreen />;
    case 'statistics': return <StatisticsScreen />;
    case 'premium': return <PremiumScreen />;
    case 'addPlace': return <AddPlaceScreen />;
    case 'placeDetail': return <PlaceDetailScreen />;
    case 'editProfile': return <EditProfileScreen />;
    case 'terms': return <LegalRoute title="Regulamin" />;
    case 'privacy': return <LegalRoute title="Polityka prywatności" />;
    default: return null;
  }
}

function Root() {
  const { session, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onDone={() => setSplashDone(true)} />
      </>
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2D7FF9" />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <AuthFlow />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppShell />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
});

registerRootComponent(App);
export default App;
