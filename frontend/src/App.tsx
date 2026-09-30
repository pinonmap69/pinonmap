import { useState, useCallback } from 'react';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import type { Screen, Tab, NavParams } from '@/types';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { LanguageProvider, useLanguage } from '@/providers/LanguageProvider';
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
import { BoardsScreen } from '@/screens/BoardsScreen';
import { BoardDetailScreen } from '@/screens/BoardDetailScreen';
import { UserProfileScreen } from '@/screens/UserProfileScreen';
import { RoutePlannerScreen } from '@/screens/RoutePlannerScreen';
import { RoutesScreen } from '@/screens/RoutesScreen';
import { AreaSearchScreen } from '@/screens/AreaSearchScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { MissionsScreen } from '@/screens/MissionsScreen';
import { ActivityScreen } from '@/screens/ActivityScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { XpRulesScreen } from '@/screens/XpRulesScreen';
import { EventsScreen } from '@/screens/EventsScreen';
import { EventDetailScreen } from '@/screens/EventDetailScreen';
import { CreateEventScreen } from '@/screens/CreateEventScreen';
import { CustomTabBar } from '@/components/CustomTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';
const TAB_SCREENS: Screen[] = ['home','explore','map','profile','settings'];
type AuthScreen = 'welcome'|'login'|'register'|'forgot'|'terms'|'privacy';
function AuthFlow(){const [screen,setScreen]=useState<AuthScreen>('welcome');const {t}=useLanguage();if(screen==='login')return <LoginScreen onBack={()=>setScreen('welcome')} onForgot={()=>setScreen('forgot')} onGoRegister={()=>setScreen('register')}/>;if(screen==='register')return <RegisterScreen onBack={()=>setScreen('welcome')} onGoLogin={()=>setScreen('login')}/>;if(screen==='forgot')return <ForgotPasswordScreen onBack={()=>setScreen('login')}/>;if(screen==='terms'||screen==='privacy')return <View style={styles.shell}><LegalScreen title={screen==='terms'?t('termsOfService'):t('privacyPolicy')} onBack={()=>setScreen('welcome')}/></View>;return <WelcomeScreen onNavigate={(s)=>setScreen(s as AuthScreen)}/>;}
function AppShell(){const {t}=useLanguage();const [activeTab,setActiveTab]=useState<Tab>('home');const [stack,setStack]=useState<{screen:Screen;params:NavParams}[]>([{screen:'home',params:{}}]);const current=stack[stack.length-1];const navigate=useCallback((screen:Screen,params:NavParams={})=>{if(TAB_SCREENS.includes(screen)){setActiveTab(screen as Tab);setStack([{screen,params}]);}else setStack(s=>[...s,{screen,params}]);},[]);const goBack=useCallback(()=>{setStack(s=>s.length>1?s.slice(0,-1):s);},[]);const onTab=useCallback((tab:Screen)=>{setActiveTab(tab as Tab);setStack([{screen:tab,params:{}}]);},[]);const isTab=TAB_SCREENS.includes(current.screen);const noShellHeader=current.screen==='terms'||current.screen==='privacy';return <NavContext.Provider value={{navigate,goBack,params:current.params}}><View style={styles.shell}>{!isTab&&!noShellHeader&&<ScreenHeader title={({statistics:t('progressTitle'),missions:t('missions'),activity:t('activityHistory'),leaderboard:t('leaderboard'),xpRules:t('xpRules'),events:t('events'),eventDetail:t('events'),createEvent:t('createEvent'),premium:'Premium',addPlace:t('addPlace'),placeDetail:t('placeDetails'),editProfile:t('editProfile'),boards:t('myBoards'),boardDetail:current.params.boardName??t('boardDetails'),userProfile:t('profile'),routePlanner:t('routePlanner'),routes:t('myRoutes'),areaSearch:current.params.nearby?t('nearbyTitle'):t('areaSearch'),search:t('search')} as Record<string,string>)[current.screen]??''} onBack={goBack}/>}<View style={styles.content} key={`${stack.length}-${current.screen}`}>{renderAppScreen(current.screen,t)}</View>{isTab&&<CustomTabBar activeTab={activeTab} onTab={onTab}/>}</View></NavContext.Provider>}
function LegalRoute({title}:{title:string}){const {goBack}=useNav();return <LegalScreen title={title} onBack={goBack}/>;}
function renderAppScreen(screen:Screen,t:ReturnType<typeof useLanguage>['t']){switch(screen){case'home':return <HomeScreen/>;case'explore':return <ExploreScreen/>;case'map':return <MapScreen/>;case'profile':return <ProfileScreen/>;case'settings':return <SettingsScreen/>;case'statistics':return <StatisticsScreen/>;case'premium':return <PremiumScreen/>;case'addPlace':return <AddPlaceScreen/>;case'placeDetail':return <PlaceDetailScreen/>;case'editProfile':return <EditProfileScreen/>;case'boards':return <BoardsScreen/>;case'boardDetail':return <BoardDetailScreen/>;case'userProfile':return <UserProfileScreen/>;case'routePlanner':return <RoutePlannerScreen/>;case'routes':return <RoutesScreen/>;case'areaSearch':return <AreaSearchScreen/>;case'search':return <SearchScreen/>;case'missions':return <MissionsScreen/>;case'activity':return <ActivityScreen/>;case'leaderboard':return <LeaderboardScreen/>;case'xpRules':return <XpRulesScreen/>;case'events':return <EventsScreen/>;case'eventDetail':return <EventDetailScreen/>;case'createEvent':return <CreateEventScreen/>;case'terms':return <LegalRoute title={t('termsOfService')}/>;case'privacy':return <LegalRoute title={t('privacyPolicy')}/>;default:return null;}}
function Root(){const {session,loading}=useAuth();const [splashDone,setSplashDone]=useState(false);if(!splashDone)return <><StatusBar style="light"/><SplashScreen onDone={()=>setSplashDone(true)}/></>;if(loading)return <View style={styles.loader}><StatusBar style="dark"/><ActivityIndicator size="large" color="#2D7FF9"/></View>;if(!session)return <><StatusBar style="light"/><AuthFlow/></>;return <><StatusBar style="dark"/><AppShell/></>;}
function App(){return <SafeAreaProvider><LanguageProvider><AuthProvider><Root/></AuthProvider></LanguageProvider></SafeAreaProvider>;}
const styles=StyleSheet.create({shell:{flex:1,backgroundColor:'#F8FAFC'},content:{flex:1},loader:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F8FAFC'}});
registerRootComponent(App);export default App;
