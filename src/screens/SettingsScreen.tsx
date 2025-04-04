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
import { auth, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  
  // Example settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  
  const toggleNotifications = () => {
    setNotificationsEnabled(previous => !previous);
    // In a real app, you would save this preference to the user's profile
  };
  
  const toggleDarkMode = () => {
    setDarkModeEnabled(previous => !previous);
    // In a real app, you would apply the theme change
  };
  
  const handleCurrencyChange = () => {
    Alert.alert(
      'Change Default Currency',
      'This feature is not implemented yet.',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="notifications" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#CBD5E0', true: '#5E72E4' }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="dark-mode" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#CBD5E0', true: '#5E72E4' }}
            thumbColor="#FFFFFF"
          />
        </View>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.settingItem} onPress={handleCurrencyChange}>
          <View style={styles.settingInfo}>
            <Icon name="attach-money" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>Default Currency</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>{defaultCurrency}</Text>
            <Icon name="chevron-right" size={24} color="#CBD5E0" />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="person" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>Edit Profile</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#CBD5E0" />
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="lock" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>Change Password</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#CBD5E0" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="help" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>FAQ</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#CBD5E0" />
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="email" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>Contact Support</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#CBD5E0" />
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="info" size={24} color="#5E72E4" style={styles.settingIcon} />
            <Text style={styles.settingText}>About</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#CBD5E0" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafc',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#32325d',
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
    color: '#32325d',
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: '#A0AEC0',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
});

export default SettingsScreen;
