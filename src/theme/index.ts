// Re-export theme context and utilities
export { 
  ThemeProvider, 
  useTheme, 
  darkTheme, 
  lightTheme,
  type Theme,
  type ThemeMode,
} from '../context/ThemeContext';

// Legacy default export for backward compatibility (uses dark theme)
import { darkTheme } from '../context/ThemeContext';
export default darkTheme;

