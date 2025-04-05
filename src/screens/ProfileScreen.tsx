import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        setUserData(userDoc.data() as User);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {userData?.displayName ? userData.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.displayName}>{userData?.displayName || 'User'}</Text>
        <Text style={styles.email}>{userData?.email || ''}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={24} color={theme.primary} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: theme.text }]}>Settings</Text>
          <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSignOut}
        >
          <Icon name="logout" size={24} color={theme.error} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: theme.error }]}>Sign Out</Text>
          <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About Warikko</Text>
        <Text style={[styles.aboutText, { color: theme.secondaryText }]}>
          Warikko is a simple expense splitting app that helps you track shared expenses with friends and groups.
        </Text>
        <Text style={[styles.versionText, { color: theme.tertiaryText }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    textAlign: 'right',
  },
});

export default ProfileScreen;
