import { createContext, useContext } from 'react';

import type { ScreenNavigation } from './screenNavigation';

export const ScreenNavigationContext = createContext<ScreenNavigation>('none');
export function useScreenNavigation() { return useContext(ScreenNavigationContext); }
