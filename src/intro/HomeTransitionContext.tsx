import { router } from 'expo-router';
import { createContext, useContext } from 'react';

export const HomeTransitionContext = createContext({
  active: false,
  pauseDestination: false,
  returnHome: () => { router.replace('/today'); },
});
export function useHomeTransition() { return useContext(HomeTransitionContext); }
