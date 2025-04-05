/**
 * Warikko - A Splitwise Clone
 * https://github.com/rodneykeilson/warikko
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Navigation
import RootNavigator from './src/navigation';

// Theme
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  '[react-native-gesture-handler]',
]);

// StatusBar component that changes with theme
const ThemedStatusBar = () => {
  const { isDarkMode, theme } = useTheme();
  return (
    <StatusBar 
      barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      backgroundColor={theme.card}
    />
  );
};

function AppContent(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemedStatusBar />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
