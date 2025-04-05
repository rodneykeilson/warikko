import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../../services/firebase';
import { useTheme } from '../../context/ThemeContext';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await registerUser(email, password, displayName);
      // Navigation will be handled by the auth state listener in the navigation component
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'Please try again with different credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subHeaderText, { color: theme.secondaryText }]}>Join Warikko to split expenses with friends</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <Text style={[styles.label, { color: theme.secondaryText }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter your full name"
            placeholderTextColor={theme.tertiaryText}
            value={displayName}
            onChangeText={setDisplayName}
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: theme.secondaryText }]}>Email</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Enter your email"
            placeholderTextColor={theme.tertiaryText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: theme.secondaryText }]}>Password</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Create a password"
            placeholderTextColor={theme.tertiaryText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={[styles.label, { color: theme.secondaryText }]}>Confirm Password</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border,
              color: theme.text
            }]}
            placeholder="Confirm your password"
            placeholderTextColor={theme.tertiaryText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: theme.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.secondaryText }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 10,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  registerButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
