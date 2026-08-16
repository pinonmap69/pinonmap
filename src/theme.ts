import type { Screen } from './types';
import {
  Home,
  Compass,
  MapPin,
  User,
  Settings,
  Plane,
  Sparkles,
  BarChart3,
  Trophy,
  Crown,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export const TABS: { id: Screen; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'map', label: 'Map', icon: MapPin },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const HOME_CARDS = [
  { id: 'journey', title: 'My Journey', subtitle: 'Track your travel memories.', icon: Plane, screen: 'profile' as Screen, gradient: ['#2D7FF9', '#3EC7B8'] },
  { id: 'map', title: 'Travel Map', subtitle: 'Discover places around the world.', icon: MapPin, screen: 'map' as Screen, gradient: ['#3EC7B8', '#60A5FA'] },
  { id: 'inspiration', title: 'Travel Inspiration', subtitle: 'See recommendations from other travelers.', icon: Sparkles, screen: 'explore' as Screen, gradient: ['#FF9F43', '#FDBA74'] },
  { id: 'statistics', title: 'Travel Statistics', subtitle: 'Track your adventure.', icon: BarChart3, screen: 'statistics' as Screen, gradient: ['#2563EB', '#60A5FA'] },
  { id: 'achievements', title: 'Achievements', subtitle: 'Unlock travel badges.', icon: Trophy, screen: 'profile' as Screen, gradient: ['#FB923C', '#EA580C'] },
  { id: 'premium', title: 'Premium', subtitle: 'Offline maps and premium features.', icon: Crown, screen: 'premium' as Screen, gradient: ['#2D7FF9', '#1D4ED8'] },
  { id: 'settings', title: 'Settings', subtitle: 'Manage your account.', icon: SettingsIcon, screen: 'settings' as Screen, gradient: ['#475569', '#64748B'] },
];

export const HERO_IMAGE = 'https://images.pexels.com/photos/27651087/pexels-photo-27651087.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
export const WELCOME_IMAGE = 'https://images.pexels.com/photos/9896355/pexels-photo-9896355.jpeg?auto=compress&cs=tinysrgb&h=1200&w=800';
export const SPLASH_IMAGE = 'https://images.pexels.com/photos/1369612/pexels-photo-1369612.jpeg?auto=compress&cs=tinysrgb&h=1200&w=800';
export const MAP_IMAGE = 'https://images.pexels.com/photos/26745113/pexels-photo-26745113.jpeg?auto=compress&cs=tinysrgb&h=1200&w=800';
export const EXPLORE_IMAGE = 'https://images.pexels.com/photos/1028896/pexels-photo-1028896.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200';
export const STATS_IMAGE = 'https://images.pexels.com/photos/3163927/pexels-photo-3163927.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200';
export const PREMIUM_IMAGE = 'https://images.pexels.com/photos/5864358/pexels-photo-5864358.jpeg?auto=compress&cs=tinysrgb&h=900&w=1200';
