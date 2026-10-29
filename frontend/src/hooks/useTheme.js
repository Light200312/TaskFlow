import { useEffect, useState } from "react";

const THEME_KEY = "taskflow_theme";

export default function useTheme() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem(THEME_KEY) === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  function toggleTheme() {
    setIsDark((currentTheme) => !currentTheme);
  }

  return { isDark, toggleTheme };
}
