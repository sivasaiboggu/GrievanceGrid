import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius } from '../theme';

export function ProfileScreen({ user, onLogout }) {
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('grievancegrid_token');
          await AsyncStorage.removeItem('grievancegrid_user');
          onLogout();
        },
      },
    ]);
  };

  const handlePasswordChangePrompt = () => {
    Alert.alert(
      'Security',
      'To update your password, a secure reset link will be sent to your registered contact.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Link', onPress: () => Alert.alert('Request Submitted', 'Password update instructions sent.') },
      ]
    );
  };

  const handleHelpPress = () => {
    Alert.alert(
      'Civic Grievance Help',
      'For municipal assistance or urgent civic emergencies, call toll-free helpline 1916 or contact support@grievancegrid.gov.in.'
    );
  };

  const handleAboutPress = () => {
    Alert.alert(
      'About GrievanceGrid',
      'GrievanceGrid Civic Resolution Platform\nVersion 1.0.0 (Production Build)\n\nAn evidence-aware municipal grievance routing and public service delivery system.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Badge */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'GG'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Citizen'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>✓ Active Account</Text>
        </View>
      </View>

      {/* SECTION: PROFILE */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Profile Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{user?.name || 'Not provided'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Email Address</Text>
          <Text style={styles.value}>{user?.email || 'Not provided'}</Text>
        </View>
        {user?.phone ? (
          <>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>{user.phone}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* SECTION: PREFERENCES */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.preferenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceTitle}>Status Notifications</Text>
            <Text style={styles.preferenceSubtitle}>Receive updates on grievance resolution</Text>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>English (Standard)</Text>
        </View>
      </View>

      {/* SECTION: SECURITY */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Security</Text>
        <TouchableOpacity style={styles.actionRow} onPress={handlePasswordChangePrompt}>
          <Text style={styles.actionRowText}>Change Password</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Session Security</Text>
          <Text style={styles.statusGreen}>Protected & Active</Text>
        </View>
      </View>

      {/* SECTION: SUPPORT */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Support & Information</Text>
        <TouchableOpacity style={styles.actionRow} onPress={handleHelpPress}>
          <Text style={styles.actionRowText}>Help & Civic Guidelines</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleAboutPress}>
          <Text style={styles.actionRowText}>About GrievanceGrid</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION: ACCOUNT (LOGOUT) */}
      <View style={styles.sectionCard}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  statusGreen: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  preferenceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  preferenceSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '600',
  },
  logoutBtn: {
    height: 44,
    backgroundColor: '#FFEBEE',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '700',
  },
});
