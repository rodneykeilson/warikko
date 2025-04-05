import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme colors
export const lightTheme = {
  background: '#f9fafc',
  card: '#FFFFFF',
  text: '#32325d',
  secondaryText: '#525f7f',
  tertiaryText: '#8898aa',
  primary: '#5E72E4',
  border: '#E2E8F0',
  divider: '#E2E8F0',
  shadow: '#000',
  success: '#4CAF50',
  error: '#F44336',
  icon: '#5E72E4',
  inputBackground: '#f7fafc',
  switchTrack: {
    false: '#CBD5E0',
    true: '#5E72E4',
  },
  switchThumb: '#FFFFFF',
};

export const darkTheme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#E4E6EB',
  secondaryText: '#B0B3B8',
  tertiaryText: '#8A8D91',
  primary: '#5E72E4',
  border: '#2C2C2C',
  divider: '#2C2C2C',
  shadow: '#000',
  success: '#4CAF50',
  error: '#F44336',
  icon: '#5E72E4',
  inputBackground: '#2C2C2C',
  switchTrack: {
    false: '#3A3B3C',
    true: '#5E72E4',
  },
  switchThumb: '#FFFFFF',
};

type ThemeType = typeof lightTheme;

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Use system preference if no saved preference
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error: unknown) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      // Save theme preference
      AsyncStorage.setItem('theme_preference', newValue ? 'dark' : 'light').catch((error: unknown) => {
        console.error('Failed to save theme preference:', error);
      });
      return newValue;
    });
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
    // Save theme preference
    AsyncStorage.setItem('theme_preference', isDark ? 'dark' : 'light').catch((error: unknown) => {
      console.error('Failed to save theme preference:', error);
    });
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
