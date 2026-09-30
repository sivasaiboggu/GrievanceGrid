import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius } from '../theme';
import { mobileApi, getApiBaseUrl, setApiBaseUrl } from '../api';

export function AuthScreen({ onAuthSuccess }) {
  // Mode: 'SIGNIN' | 'REGISTER' | 'FORGOT' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'CONFIG'
  const [mode, setMode] = useState('SIGNIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Password recovery flow state
  const [recoveryContact, setRecoveryContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    getApiBaseUrl().then((url) => setApiUrl(url));
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    try {
      const res = await mobileApi.login({ email: email.trim(), password });
      await AsyncStorage.setItem('grievancegrid_token', res.token);
      await AsyncStorage.setItem('grievancegrid_user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must contain at least 8 characters.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    try {
      const res = await mobileApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        role: 'CITIZEN',
      });
      await AsyncStorage.setItem('grievancegrid_token', res.token);
      await AsyncStorage.setItem('grievancegrid_user', JSON.stringify(res.user));
      onAuthSuccess(res.user);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!recoveryContact.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await mobileApi.forgotPassword(recoveryContact.trim());
      setInfoMessage(`Verification code sent to ${recoveryContact.trim()}`);
      setMode('VERIFY_OTP');
    } catch (err) {
      setErrorMessage(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await mobileApi.verifyOtp(recoveryContact.trim(), otpCode.trim());
      setResetToken(res.resetToken || 'verified');
      setInfoMessage('Verification successful. Please enter your new password.');
      setMode('RESET_PASSWORD');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      await mobileApi.resetPassword(recoveryContact.trim(), resetToken, newPassword);
      Alert.alert('Password Updated', 'Your password has been reset. Please sign in.');
      setPassword('');
      setNewPassword('');
      setOtpCode('');
      setRecoveryContact('');
      setErrorMessage('');
      setInfoMessage('Password updated successfully. Please sign in.');
      setMode('SIGNIN');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = async () => {
    try {
      await setApiBaseUrl(apiUrl.trim());
      Alert.alert('Configuration Saved', `API Base URL updated to:\n${apiUrl.trim()}`);
      setMode('SIGNIN');
    } catch (e) {
      Alert.alert('Error', 'Failed to save API URL.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Crest */}
        <View style={styles.crestContainer}>
          <View style={styles.crestCircle}>
            <Text style={styles.crestIcon}>🏛️</Text>
          </View>
          <Text style={styles.appTitle}>GrievanceGrid</Text>
          <Text style={styles.appSubtitle}>Municipal Grievance Platform</Text>
        </View>

        {/* Server IP Config Banner */}
        <TouchableOpacity
          onPress={() => {
            setErrorMessage('');
            setInfoMessage('');
            setMode(mode === 'CONFIG' ? 'SIGNIN' : 'CONFIG');
          }}
          style={styles.configBanner}
        >
          <Text style={styles.configBannerText}>
            ⚙️ API: {apiUrl || 'Auto-detecting...'} (Tap to edit)
          </Text>
        </TouchableOpacity>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        {infoMessage ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>ℹ️ {infoMessage}</Text>
          </View>
        ) : null}

        {/* ================= CONFIG MODE ================= */}
        {mode === 'CONFIG' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mobile API Network Setup</Text>
            <Text style={styles.cardDesc}>
              For physical Android phone testing, ensure this IP matches your computer's local Wi-Fi IP address and port 8000.
            </Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://192.168.1.X:8000/api"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveApiUrl}>
              <Text style={styles.primaryBtnText}>Save Connection URL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('SIGNIN')}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= SIGN IN MODE ================= */}
        {mode === 'SIGNIN' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardDesc}>
              Sign in to track grievances and monitor municipal resolution timers.
            </Text>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="resident@civic.gov"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.fieldHeaderRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setErrorMessage('');
                  setInfoMessage('');
                  setRecoveryContact(email);
                  setMode('FORGOT');
                }}
              >
                <Text style={styles.forgotLinkText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.visibilityBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.visibilityBtnText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setErrorMessage('');
                setInfoMessage('');
                setMode('REGISTER');
              }}
              style={styles.switchModeBtn}
            >
              <Text style={styles.switchModeText}>
                New to GrievanceGrid? <Text style={styles.linkText}>Create an account</Text>
              </Text>
            </TouchableOpacity>

            {/* Development / Demo Credentials Helper */}
            <View style={styles.devSection}>
              <Text style={styles.devSectionTitle}>Demo / Testing Accounts</Text>
              <View style={styles.devChipsRow}>
                <TouchableOpacity
                  style={styles.devChip}
                  onPress={() => {
                    setEmail('citizen@grievancegrid.gov.in');
                    setPassword('Password123!');
                    setErrorMessage('');
                    setInfoMessage('Loaded Citizen credentials');
                  }}
                >
                  <Text style={styles.devChipText}>Citizen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.devChip}
                  onPress={() => {
                    setEmail('officer@grievancegrid.gov.in');
                    setPassword('Password123!');
                    setErrorMessage('');
                    setInfoMessage('Loaded Officer credentials');
                  }}
                >
                  <Text style={styles.devChipText}>Officer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.devChip}
                  onPress={() => {
                    setEmail('authority@grievancegrid.gov.in');
                    setPassword('Password123!');
                    setErrorMessage('');
                    setInfoMessage('Loaded Authority credentials');
                  }}
                >
                  <Text style={styles.devChipText}>Authority</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.devChip}
                  onPress={() => {
                    setEmail('worker@grievancegrid.gov.in');
                    setPassword('Password123!');
                    setErrorMessage('');
                    setInfoMessage('Loaded Field Worker credentials');
                  }}
                >
                  <Text style={styles.devChipText}>Worker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= REGISTER MODE ================= */}
        {mode === 'REGISTER' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Civic Account</Text>
            <Text style={styles.cardDesc}>
              Register for verified municipal grievance filings and case tracking.
            </Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Elena Vance"
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="elena@resident.gov"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 014-9921"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Password (8+ chars)</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Create strong password"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.visibilityBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.visibilityBtnText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setErrorMessage('');
                setInfoMessage('');
                setMode('SIGNIN');
              }}
              style={styles.switchModeBtn}
            >
              <Text style={styles.switchModeText}>
                Already have an account? <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= FORGOT PASSWORD MODE ================= */}
        {mode === 'FORGOT' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reset Your Password</Text>
            <Text style={styles.cardDesc}>
              Enter your registered email address to receive a verification OTP code.
            </Text>

            <Text style={styles.label}>Registered Email</Text>
            <TextInput
              style={styles.input}
              value={recoveryContact}
              onChangeText={setRecoveryContact}
              placeholder="resident@civic.gov"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Send OTP Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setErrorMessage('');
                setInfoMessage('');
                setMode('SIGNIN');
              }}
              style={styles.switchModeBtn}
            >
              <Text style={styles.switchModeText}>
                Remember your password? <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= VERIFY OTP MODE ================= */}
        {mode === 'VERIFY_OTP' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verify Security Code</Text>
            <Text style={styles.cardDesc}>
              Enter the 6-digit verification code sent to {recoveryContact}.
            </Text>

            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 4, fontSize: 18, textAlign: 'center' }]}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setErrorMessage('');
                setInfoMessage('');
                setMode('FORGOT');
              }}
              style={styles.switchModeBtn}
            >
              <Text style={styles.switchModeText}>
                Didn't receive code? <Text style={styles.linkText}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= RESET PASSWORD MODE ================= */}
        {mode === 'RESET_PASSWORD' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Set New Password</Text>
            <Text style={styles.cardDesc}>
              Choose a strong password with at least 8 characters.
            </Text>

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (8+ chars)"
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Save New Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  crestContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  crestCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  crestIcon: {
    fontSize: 26,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  appSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  configBanner: {
    backgroundColor: colors.surfaceContainerHigh,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  configBannerText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#ba1a1a33',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondaryFixed,
  },
  infoText: {
    color: colors.secondary,
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  forgotLinkText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityBtn: {
    height: 44,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityBtnText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  input: {
    height: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
  primaryBtn: {
    height: 48,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  switchModeBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  switchModeText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  linkText: {
    color: colors.secondary,
    fontWeight: 'bold',
  },
  devSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  devSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  devChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
  },
  devChip: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#D0D7DE',
  },
  devChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F1E36',
  },
});
