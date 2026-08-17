import { AppState } from 'react-native';
import { supabase } from './supabase';

let installed = false;

export function installSupabaseAutoRefresh() {
  if (installed) return () => {};
  installed = true;

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });

  supabase.auth.startAutoRefresh();

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
    installed = false;
  };
}
