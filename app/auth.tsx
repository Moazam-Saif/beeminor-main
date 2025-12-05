import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { router } from 'expo-router';

const isWeb = Platform.OS === 'web';
const MAX_WEB_WIDTH = 500;

type ScreenMode = 'login' | 'register' | 'forgot' | 'reset';

export default function AuthScreen() {
  const { register, login, requestPasswordReset, resetPassword } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ScreenMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [sponsorCode, setSponsorCode] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const handleSubmit = async () => {
    if (mode === 'forgot') {
      if (!email.trim()) {
        Alert.alert(t.error, t.enterEmail);
        return;
      }

      setLoading(true);
      try {
        const result = await requestPasswordReset(email);
        if (result.success) {
          Alert.alert(
            t.emailSent,
            `${t.resetCodeSentTo} ${email}. ${t.checkLogsForCode} ${result.code}`,
            [
              {
                text: 'OK',
                onPress: () => setMode('reset'),
              },
            ]
          );
        } else {
          Alert.alert(t.error, result.error || t.error);
        }
      } catch (error) {
        Alert.alert(t.error, t.error);
        console.error('Password reset request error:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (!email.trim() || !resetCode.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
        Alert.alert(t.error, t.fillAllFields);
        return;
      }

      if (newPassword !== confirmNewPassword) {
        Alert.alert(t.error, t.passwordsDontMatch);
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert(t.error, t.passwordTooShort);
        return;
      }

      setLoading(true);
      try {
        const result = await resetPassword(email, resetCode, newPassword);
        if (result.success) {
          Alert.alert(
            t.success,
            t.passwordResetSuccess,
            [
              {
                text: 'OK',
                onPress: () => {
                  setMode('login');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setPassword('');
                },
              },
            ]
          );
        } else {
          Alert.alert(t.error, result.error || t.error);
        }
      } catch (error) {
        Alert.alert(t.error, t.error);
        console.error('Password reset error:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        Alert.alert(t.error, t.passwordsDontMatch);
        return;
      }

      if (password.length < 6) {
        Alert.alert(t.error, t.passwordTooShort);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const result = await register(email, password, sponsorCode || undefined);
        if (result.success) {
          router.replace('/(tabs)/(home)');
        } else {
          Alert.alert(t.error, result.error || t.error);
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          router.replace('/(tabs)/(home)');
        } else {
          Alert.alert(t.error, result.error || t.error);
        }
      }
    } catch (error) {
      Alert.alert(t.error, t.error);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: ScreenMode) => {
    setMode(newMode);
    if (newMode !== 'reset') {
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
    if (newMode === 'login' || newMode === 'register') {
      setPassword('');
      setConfirmPassword('');
      setSponsorCode('');
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'register':
        return t.createAccount;
      case 'forgot':
        return t.forgotPassword;
      case 'reset':
        return t.resetPasswordTitle;
      default:
        return t.login;
    }
  };

  const getButtonText = () => {
    if (loading) return t.loading;
    switch (mode) {
      case 'register':
        return t.register;
      case 'forgot':
        return t.sendCode;
      case 'reset':
        return t.resetButton;
      default:
        return t.loginButton;
    }
  };

  const languages = [
    { lang: 'fr' as const, flag: '🇫🇷' },
    { lang: 'en' as const, flag: '🇬🇧' },
    { lang: 'es' as const, flag: '🇪🇸' },
    { lang: 'de' as const, flag: '🇩🇪' },
    { lang: 'it' as const, flag: '🇮🇹' },
    { lang: 'pt' as const, flag: '🇵🇹' },
    { lang: 'ru' as const, flag: '🇷🇺' },
    { lang: 'ar' as const, flag: '🇸🇦' },
    { lang: 'id' as const, flag: '🇮🇩' },
  ];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: isWeb ? 40 : insets.top + 20, paddingBottom: isWeb ? 40 : insets.bottom + 20, maxWidth: isWeb ? MAX_WEB_WIDTH : undefined, width: '100%', alignSelf: 'center' },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.languageSelector}>
            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languageScrollContent}
            >
              {languages.map(({ lang, flag }) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageFlagButton,
                    currentLanguage === lang && styles.languageFlagButtonActive,
                  ]}
                  onPress={() => changeLanguage(lang)}
                >
                  <Text style={styles.languageFlag}>{flag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.logo}>🐝</Text>
              <Text style={styles.title}>BeeMinor</Text>
              <Text style={styles.slogan}>{t.joinBeeMinorPlayWin}</Text>
              <Text style={styles.subtitle}>{getTitle()}</Text>
            </View>

            <View style={styles.form}>
              {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t.email}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t.enterEmail}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {(mode === 'login' || mode === 'register') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t.password}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t.enterPassword}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              {mode === 'register' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t.confirmPassword}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t.confirmPasswordPlaceholder}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t.sponsorCode}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t.enterSponsorCode}
                      value={sponsorCode}
                      onChangeText={setSponsorCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999"
                    />
                  </View>
                </>
              )}

              {mode === 'reset' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t.email}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t.enterEmail}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t.resetCode}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t.enterResetCode}
                      value={resetCode}
                      onChangeText={setResetCode}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t.newPassword}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t.enterNewPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{t.confirmNewPassword}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t.confirmYourNewPassword}
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="#999"
                    />
                  </View>
                </>
              )}

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{getButtonText()}</Text>
              </TouchableOpacity>

              {mode === 'login' && (
                <TouchableOpacity 
                  style={styles.forgotButton}
                  onPress={() => switchMode('forgot')}
                  disabled={loading}
                >
                  <Text style={styles.forgotButtonText}>{t.forgotPassword}</Text>
                </TouchableOpacity>
              )}

              {(mode === 'login' || mode === 'register') && (
                <TouchableOpacity 
                  style={styles.switchButton}
                  onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  disabled={loading}
                >
                  <Text style={styles.switchButtonText}>
                    {mode === 'register' ? t.alreadyHaveAccount : t.dontHaveAccount}
                  </Text>
                </TouchableOpacity>
              )}

              {(mode === 'forgot' || mode === 'reset') && (
                <TouchableOpacity 
                  style={styles.switchButton}
                  onPress={() => switchMode('login')}
                  disabled={loading}
                >
                  <Text style={styles.switchButtonText}>{t.backToLogin}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: isWeb ? 24 : 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold' as const,
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    outlineStyle: 'none' as any,
  },
  button: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#FFF',
  },
  switchButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  forgotButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  forgotButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  languageSelector: {
    marginBottom: 16,
    alignItems: 'center',
  },
  languageScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  languageFlagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  languageFlagButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  languageFlag: {
    fontSize: 20,
  },
  slogan: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500' as const,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
