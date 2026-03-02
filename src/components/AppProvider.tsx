"use client";

import RouteActivityLogger from "./RouteActivityLogger";
import ThemeInitializer from "./ThemeInitializer";

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeInitializer>
      <RouteActivityLogger />
      {children}
    </ThemeInitializer>
  );
}
