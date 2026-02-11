"use client";

import ThemeInitializer from "./ThemeInitializer";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeInitializer>
      {children}
    </ThemeInitializer>
  );
}
