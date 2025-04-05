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
import { loginUser } from '../../services/firebase';
import { useTheme } from '../../context/ThemeContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      // Navigation will be handled by the auth state listener in the navigation component
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
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
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: theme.primary }]}>Warikko</Text>
          <Text style={[styles.tagline, { color: theme.secondaryText }]}>Split expenses with friends</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
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
            placeholder="Enter your password"
            placeholderTextColor={theme.tertiaryText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword' as never)}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.secondaryText }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
              <Text style={[styles.registerLink, { color: theme.primary }]}>Sign Up</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
  },
  formContainer: {
    borderRadius: 10,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
