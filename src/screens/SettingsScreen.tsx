import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  
  // Example settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  
  const toggleNotifications = () => {
    setNotificationsEnabled(previous => !previous);
    // In a real app, you would save this preference to the user's profile
  };
  
  const toggleDarkMode = () => {
    toggleTheme();
  };
  
  const handleCurrencyChange = () => {
    Alert.alert(
      'Change Default Currency',
      'This feature is not implemented yet.',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>General</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="notifications" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: theme.switchTrack.false, true: theme.switchTrack.true }}
            thumbColor={theme.switchThumb}
          />
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="dark-mode" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: theme.switchTrack.false, true: theme.switchTrack.true }}
            thumbColor={theme.switchThumb}
          />
        </View>
        
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        <TouchableOpacity style={styles.settingItem} onPress={handleCurrencyChange}>
          <View style={styles.settingInfo}>
            <Icon name="attach-money" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>Default Currency</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={[styles.settingValueText, { color: theme.tertiaryText }]}>{defaultCurrency}</Text>
            <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.section, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="person" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>Edit Profile</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="lock" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>Change Password</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.section, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Help & Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="help" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>FAQ</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="email" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>Contact Support</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="info" size={24} color={theme.icon} style={styles.settingIcon} />
            <Text style={[styles.settingText, { color: theme.text }]}>About</Text>
          </View>
          <Icon name="chevron-right" size={24} color={theme.tertiaryText} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    marginRight: 8,
  },
  divider: {
    height: 1,
  },
});

export default SettingsScreen;
