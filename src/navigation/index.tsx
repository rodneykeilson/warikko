import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main App Screens
import DashboardScreen from '../screens/DashboardScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ExpenseDetailsScreen from '../screens/ExpenseDetailsScreen';
import SettlementsScreen from '../screens/SettlementsScreen';
import SettlementDetailsScreen from '../screens/SettlementDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Stack Navigators
const AuthStack = createStackNavigator();
const DashboardStack = createStackNavigator();
const GroupsStack = createStackNavigator();
const SettlementsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Tab Navigator
const Tab = createBottomTabNavigator();

// Auth Navigator
const AuthNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Dashboard Stack Navigator
const DashboardStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text },
        cardStyle: { backgroundColor: theme.background }
      }}
    >
      <DashboardStack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard' }}
      />
      <DashboardStack.Screen 
        name="ExpenseDetails" 
        component={ExpenseDetailsScreen} 
        options={{ title: 'Expense Details' }}
      />
    </DashboardStack.Navigator>
  );
};

// Groups Stack Navigator
const GroupsStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <GroupsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text },
        cardStyle: { backgroundColor: theme.background }
      }}
    >
      <GroupsStack.Screen 
        name="Groups" 
        component={GroupsScreen} 
        options={{ title: 'My Groups' }}
      />
      <GroupsStack.Screen 
        name="GroupDetails" 
        component={GroupDetailsScreen} 
        options={({ route }) => ({ title: (route.params as any)?.groupName || 'Group Details' })}
      />
      <GroupsStack.Screen 
        name="AddExpense" 
        component={AddExpenseScreen} 
        options={{ title: 'Add Expense' }}
      />
      <GroupsStack.Screen 
        name="ExpenseDetails" 
        component={ExpenseDetailsScreen} 
        options={{ title: 'Expense Details' }}
      />
    </GroupsStack.Navigator>
  );
};

// Settlements Stack Navigator
const SettlementsStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <SettlementsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text },
        cardStyle: { backgroundColor: theme.background }
      }}
    >
      <SettlementsStack.Screen 
        name="Settlements" 
        component={SettlementsScreen} 
        options={{ title: 'Settlements' }}
      />
      <SettlementsStack.Screen 
        name="SettlementDetails" 
        component={SettlementDetailsScreen} 
        options={{ title: 'Settlement Details' }}
      />
    </SettlementsStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text },
        cardStyle: { backgroundColor: theme.background }
      }}
    >
      <ProfileStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </ProfileStack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = 'dashboard';
          } else if (route.name === 'GroupsTab') {
            iconName = 'group';
          } else if (route.name === 'SettlementsTab') {
            iconName = 'payment';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tertiaryText,
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: theme.card,
          borderTopColor: theme.border 
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStackNavigator} 
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="GroupsTab" 
        component={GroupsStackNavigator} 
        options={{ title: 'Groups' }}
      />
      <Tab.Screen 
        name="SettlementsTab" 
        component={SettlementsStackNavigator} 
        options={{ title: 'Settlements' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const RootNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { theme, isDarkMode } = useTheme();
  
  // Create custom navigation theme based on our app theme
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      // Add any required properties with fallbacks to avoid undefined
      notification: isDarkMode ? DarkTheme.colors.notification : DefaultTheme.colors.notification,
    },
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
