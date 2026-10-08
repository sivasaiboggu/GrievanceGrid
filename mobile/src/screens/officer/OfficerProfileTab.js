import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';

export function OfficerProfileTab({ user, onLogout }) {
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out of Municipal Portal',
      'Are you sure you want to end your active officer casework session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const handleInfoNotice = (title, message) => {
    Alert.alert(title, message);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Officer Identification Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'O'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>MUNICIPAL OFFICER • GRO-III</Text>
              </View>
            </View>
            <Text style={styles.userName}>{user?.name || 'Officer'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'officer@grievancegrid.gov.in'}</Text>
          </View>
        </View>

        <View style={styles.credentialsDivider} />

        <View style={styles.credentialsGrid}>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Jurisdiction</Text>
            <Text style={styles.credValue}>Central Precinct (Sector 4C)</Text>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Duty Shift</Text>
            <Text style={styles.credValue}>Active (06:00 - 18:00)</Text>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Station Desk</Text>
            <Text style={styles.credValue}>Municipal Grievance Cell</Text>
          </View>
          <View style={styles.credItem}>
            <Text style={styles.credLabel}>Official Phone</Text>
            <Text style={styles.credValue}>{user?.phone || '+91 94230 11223'}</Text>
          </View>
        </View>
      </View>

      {/* Casework Preferences */}
      <Text style={styles.sectionHeader}>Operational Settings</Text>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleInfoNotice(
              'Notification Alerts',
              'SLA Breach and Appeal Escalation pushes are active on this municipal device.'
            )
          }
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>SLA & Appeal Alert Thresholds</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleInfoNotice(
              'Precinct Boundary',
              'Assigned to Central Administrative Zone (Zone 4) under Municipal Master Plan.'
            )
          }
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🗺️</Text>
            <Text style={styles.menuText}>Precinct Sector Boundary</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleInfoNotice(
              'Security Credentials',
              'Role verified by Municipal Public Sector Key. Password management governed by IT Policy §12.'
            )
          }
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Authentication & Security</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Institutional Framework */}
      <Text style={styles.sectionHeader}>Governance & Operating Standards</Text>
      <View style={styles.menuGroup}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleInfoNotice(
              'Civic Resolution Framework',
              'GrievanceGrid Academic Research Prototype at IIIT Kottayam. Complies with Municipal Service Level Agreements.'
            )
          }
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>🏛️</Text>
            <Text style={styles.menuText}>About GrievanceGrid</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleInfoNotice(
              'Operational Support',
              'Precinct Technical Helpline: Ext. 4021 / helpdesk@grievancegrid.gov.in'
            )
          }
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuText}>Casework Technical Support</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Trigger */}
      <TouchableOpacity
        style={styles.signOutBtn}
        activeOpacity={0.85}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutBtnText}>Exit Officer Portal (Sign Out)</Text>
      </TouchableOpacity>

      <Text style={styles.footerLegal}>
        GrievanceGrid v2.1 • Evidence-Aware Civic Resolution Platform
      </Text>
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
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  roleBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  credentialsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  credentialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  credItem: {
    width: '48%',
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.xs,
    borderRadius: radius.xs,
  },
  credLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  credValue: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
  },
  signOutBtn: {
    height: 44,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  signOutBtnText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  footerLegal: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
