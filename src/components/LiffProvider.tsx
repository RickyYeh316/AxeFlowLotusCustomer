'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Liff } from '@line/liff';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface LiffContextType {
  liff: Liff | null;
  profile: LiffProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const LiffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liffObj, setLiffObj] = useState<Liff | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
        if (!liffId || liffId === 'YOUR_LINE_LIFF_ID') {
          console.warn("LINE LIFF ID is not configured in environment variables.");
          setIsLoading(false);
          return;
        }

        // Dynamically import to ensure it is not evaluated on the server side
        const { default: liff } = await import('@line/liff');
        
        await liff.init({ liffId });
        setLiffObj(liff);
        
        const loggedIn = liff.isLoggedIn();
        setIsLoggedIn(loggedIn);
        
        if (loggedIn) {
          const userProfile = await liff.getProfile();
          setProfile(userProfile);
        } else if (liff.isInClient()) {
          // Inside LINE client: trigger silent login automatically without showing a login button
          liff.login();
        }
      } catch (err: unknown) {
        console.error("LIFF Initialization Error:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    };

    initLiff();
  }, []);

  const login = () => {
    if (!liffObj) {
      console.error("LIFF is not initialized yet.");
      return;
    }
    if (!liffObj.isLoggedIn()) {
      liffObj.login();
    }
  };

  const logout = () => {
    if (!liffObj) {
      console.error("LIFF is not initialized yet.");
      return;
    }
    if (liffObj.isLoggedIn()) {
      liffObj.logout();
      setIsLoggedIn(false);
      setProfile(null);
      // Optional: reload the page or redirect to clean login state
      window.location.reload();
    }
  };

  return (
    <LiffContext.Provider
      value={{
        liff: liffObj,
        profile,
        isLoggedIn,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </LiffContext.Provider>
  );
};

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (context === undefined) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
};
