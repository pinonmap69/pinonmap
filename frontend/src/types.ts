import type { LucideIcon } from 'lucide-react-native';

export type Screen =
  | 'splash'
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot'
  | 'home'
  | 'explore'
  | 'map'
  | 'profile'
  | 'statistics'
  | 'premium'
  | 'settings'
  | 'terms'
  | 'privacy'
  | 'addPlace'
  | 'placeDetail'
  | 'editProfile';

export type Tab = 'home' | 'explore' | 'map' | 'profile' | 'settings';

export interface NavParams {
  placeId?: string;
  [key: string]: any;
}

export interface NavCard {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  screen: Screen;
  gradient: [string, string];
}
