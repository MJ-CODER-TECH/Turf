import { useTheme } from "../../src/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 
                 text-gray-800 dark:text-yellow-400 transition-all duration-300">
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;