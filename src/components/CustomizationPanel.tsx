import React, { useState, useEffect } from "react";
import { X, Palette, Text, LayoutGrid, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const accentColors = [
  { name: "Blue", class: "bg-blue-500", hex: "#3b82f6", hoverHex: "#2563eb" }, // blue-600
  { name: "Green", class: "bg-green-500", hex: "#22c55e", hoverHex: "#16a34a" }, // green-600
  { name: "Purple", class: "bg-purple-500", hex: "#a855f7", hoverHex: "#9333ea" }, // purple-600
  { name: "Red", class: "bg-red-500", hex: "#ef4444", hoverHex: "#dc2626" }, // red-600
  { name: "Orange", class: "bg-orange-500", hex: "#f97316", hoverHex: "#ea580c" }, // orange-600
  { name: "Cyan", class: "bg-cyan-500", hex: "#06b6d4", hoverHex: "#0891b2" }, // cyan-600
];

const fontSizeMap = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

const densityMap = {
  compact: "0.8",
  normal: "1",
  comfortable: "1.2",
};

export default function CustomizationPanel({ isOpen, onClose }: CustomizationPanelProps) {
  const [theme, setTheme] = useState<"light" | "dark">((() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light"; // Default theme for server-side rendering or initial load
  }));

  const [selectedAccentColor, setSelectedAccentColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accentColor") || accentColors[0].hex;
    }
    return accentColors[0].hex;
  });

  const [fontSize, setFontSize] = useState<keyof typeof fontSizeMap>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("fontSize") as keyof typeof fontSizeMap) || "medium";
    }
    return "medium";
  });

  const [density, setDensity] = useState<keyof typeof densityMap>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("density") as keyof typeof densityMap) || "normal";
    }
    return "normal";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.setProperty("--accent-color", selectedAccentColor);
      const chosenColor = accentColors.find(color => color.hex === selectedAccentColor);
      document.documentElement.style.setProperty("--hover-accent-color", chosenColor?.hoverHex || selectedAccentColor);
      localStorage.setItem("accentColor", selectedAccentColor);
    }
  }, [selectedAccentColor]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.setProperty("--base-font-size", fontSizeMap[fontSize]);
      localStorage.setItem("fontSize", fontSize);
    }
  }, [fontSize]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.setProperty("--density-factor", densityMap[density]);
      localStorage.setItem("density", density);
    }
  }, [density]);

  const handleThemeChange = (newTheme: "light" | "dark") => {
  localStorage.setItem("theme", newTheme);

  if (newTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  setTheme(newTheme);
};


  const handleColorChange = (hex: string) => {
    setSelectedAccentColor(hex);
  };

  const handleFontSizeChange = (newSize: keyof typeof fontSizeMap) => {
    setFontSize(newSize);
  };

  const handleDensityChange = (newDensity: keyof typeof densityMap) => {
    setDensity(newDensity);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[998]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-[25%] min-w-[300px] bg-[#0f172a] border-l border-blue-800 z-[999] flex flex-col shadow-xl p-6 text-white"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Customization</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto">

              {/* Theme / Light-Dark Mode */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sun size={20} /> <Moon size={20} /> Theme
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      theme === "light"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      theme === "dark"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Palette size={20} /> Accent Color
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {accentColors.map((color) => (
                    <div
                      key={color.name}
                      className={`${color.class} h-10 w-10 rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 ${
                        selectedAccentColor === color.hex ? "ring-4 ring-offset-2 ring-white ring-offset-[#0f172a]" : ""
                      }`}
                      onClick={() => handleColorChange(color.hex)}
                    >
                      {selectedAccentColor === color.hex && (
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Text size={20} /> Font Size
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFontSizeChange("small")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      fontSize === "small"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => handleFontSizeChange("medium")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      fontSize === "medium"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleFontSizeChange("large")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      fontSize === "large"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>

              {/* Density Layout */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <LayoutGrid size={20} /> Density Layout
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDensityChange("compact")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      density === "compact"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => handleDensityChange("normal")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      density === "normal"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => handleDensityChange("comfortable")}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                      density === "comfortable"
                        ? "bg-[var(--accent-color)] hover:bg-[var(--hover-accent-color)]"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Comfortable
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
