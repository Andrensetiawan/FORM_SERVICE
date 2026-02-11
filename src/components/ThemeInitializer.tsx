"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

const ThemeContext = createContext({
  theme: 'Default',
  setTheme: (theme: string) => {},
});

export const useTheme = () => useContext(ThemeContext);

const colorSchemeClasses: { [key: string]: string } = {
  Default: 'theme-default',
  Light: 'theme-light',
  Modern: 'theme-modern',
  Blue: 'theme-blue',
  Coffee: 'theme-coffee',
  Ectoplasm: 'theme-ectoplasm',
  Midnight: 'theme-midnight',
  Ocean: 'theme-ocean',
  Sunrise: 'theme-sunrise',
};

export default function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState('Default');

  useEffect(() => {
    const fetchTheme = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.colorScheme) {
            setTheme(userData.colorScheme);
          }
        }
      }
    };
    fetchTheme();
  }, [user]);

  useEffect(() => {
    document.body.className = ''; // Clear existing theme classes
    const themeClass = colorSchemeClasses[theme] || colorSchemeClasses['Default'];
    document.body.classList.add(themeClass);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}