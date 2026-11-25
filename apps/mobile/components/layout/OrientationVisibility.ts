import { createContext, useContext } from 'react';

export const OrientationBlockedContext = createContext(false);
export const useOrientationBlocked = () => useContext(OrientationBlockedContext);
