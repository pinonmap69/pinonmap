import { createContext, useContext } from 'react';
import type { Screen, NavParams } from '@/types';

export interface NavContextValue {
  navigate: (screen: Screen, params?: NavParams) => void;
  goBack: () => void;
  params: NavParams;
}

export const NavContext = createContext<NavContextValue>({
  navigate: () => {},
  goBack: () => {},
  params: {},
});

export const useNav = () => useContext(NavContext);
