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
  | 'privacy';

export type Tab = 'home' | 'explore' | 'map' | 'profile' | 'settings';

export interface NavCard {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  screen: Screen;
  gradient: [string, string];
}
