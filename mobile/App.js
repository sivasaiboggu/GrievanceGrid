import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius } from './src/theme';
import { mobileApi } from './src/api';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ReportProblemScreen } from './src/screens/ReportProblemScreen';
import { ComplaintsListScreen } from './src/screens/ComplaintsListScreen';
import { ComplaintDetailScreen } from './src/screens/ComplaintDetailScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { OfficerPortalScreen } from './src/screens/OfficerPortalScreen';
import { AuthorityDashboardScreen } from './src/screens/AuthorityDashboardScreen';
import { FieldWorkerScreen } from './src/screens/FieldWorkerScreen';

function AppContent() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [currentTab, setCurrentTab] = useState('HOME'); // 'HOME' | 'COMPLAINTS' | 'NOTIFS' | 'PROFILE'
  const [isReporting, setIsReporting] = useState(false);
  const [reportCategory, setReportCategory] = useState(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  // Restore session
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedUserStr = await AsyncStorage.getItem('grievancegrid_user');
        const token = await AsyncStorage.getItem('grievancegrid_token');
        if (savedUserStr && token) {
          try {
            const me = await mobileApi.getMe();
            if (me && me.user) {
              setUser(me.user);
              await AsyncStorage.setItem('grievancegrid_user', JSON.stringify(me.user));
            } else {
              setUser(JSON.parse(savedUserStr));
            }
          } catch (e) {
            if (e.status === 401 || (e.message && e.message.includes('401'))) {
              // Session expired or token invalid -> clear credentials and prompt login
              await AsyncStorage.removeItem('grievancegrid_token');
              await AsyncStorage.removeItem('grievancegrid_user');
              setUser(null);
            } else {
              // Network connectivity issue -> preserve cached session for offline access
              setUser(JSON.parse(savedUserStr));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Hardware Back Button Handler for Android
  useEffect(() => {
    const onBackPress = () => {
      if (selectedComplaintId !== null) {
        setSelectedComplaintId(null);
        return true;
      }
      if (isReporting) {
        setIsReporting(false);
        setReportCategory(null);
        return true;
      }
      if (currentTab !== 'HOME') {
        setCurrentTab('HOME');
        return true;
      }
      return false; // Exit app
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [selectedComplaintId, isReporting, currentTab]);

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <View style={styles.splashCrest}>
          <Text style={{ fontSize: 32 }}>🏛️</Text>
        </View>
        <Text style={styles.splashTitle}>GrievanceGrid</Text>
        <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem('grievancegrid_token');
    await AsyncStorage.removeItem('grievancegrid_user');
    setUser(null);
    setCurrentTab('HOME');
    setIsReporting(false);
    setSelectedComplaintId(null);
  };

  // If unauthenticated, show native Auth screen
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <AuthScreen onAuthSuccess={(authUser) => setUser(authUser)} />
      </SafeAreaView>
    );
  }

  // Authoritative Role Routing determined strictly by backend account credentials
  if (user.role === 'MUNICIPAL_OFFICER') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <OfficerPortalScreen user={user} onLogout={handleLogout} />
      </SafeAreaView>
    );
  }

  if (user.role === 'SENIOR_AUTHORITY') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <AuthorityDashboardScreen user={user} onLogout={handleLogout} />
      </SafeAreaView>
    );
  }

  if (user.role === 'FIELD_WORKER') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <FieldWorkerScreen user={user} onLogout={handleLogout} />
      </SafeAreaView>
    );
  }

  // If in reporting flow, hide bottom navigation
  if (isReporting) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <ReportProblemScreen
          initialCategory={reportCategory}
          onCancel={() => {
            setIsReporting(false);
            setReportCategory(null);
          }}
          onSuccess={(newComplaint) => {
            setIsReporting(false);
            setReportCategory(null);
            setSelectedComplaintId(newComplaint.id);
          }}
        />
      </SafeAreaView>
    );
  }

  const getHeaderTitle = () => {
    if (selectedComplaintId) return 'Complaint Docket';
    switch (currentTab) {
      case 'HOME':
        return 'GrievanceGrid';
      case 'COMPLAINTS':
        return 'My Grievances';
      case 'NOTIFS':
        return 'Alerts & Notices';
      case 'PROFILE':
        return 'Citizen Profile';
      default:
        return 'GrievanceGrid';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          {selectedComplaintId ? (
            <TouchableOpacity
              onPress={() => setSelectedComplaintId(null)}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🏛️</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerSubtitle}>MUNICIPAL CIVIC PORTAL</Text>
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => {
            setSelectedComplaintId(null);
            setCurrentTab('PROFILE');
          }}
        >
          <Text style={styles.avatarBtnText}>
            {user.name ? user.name.slice(0, 1).toUpperCase() : 'C'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {selectedComplaintId ? (
          <ComplaintDetailScreen
            complaintId={selectedComplaintId}
            onBack={() => setSelectedComplaintId(null)}
          />
        ) : (
          <>
            {currentTab === 'HOME' && (
              <HomeScreen
                onStartReport={(cat) => {
                  setReportCategory(cat);
                  setIsReporting(true);
                }}
                onViewComplaints={() => setCurrentTab('COMPLAINTS')}
                onSelectComplaint={(id) => setSelectedComplaintId(id)}
              />
            )}

            {currentTab === 'COMPLAINTS' && (
              <ComplaintsListScreen
                onSelectComplaint={(id) => setSelectedComplaintId(id)}
                onStartReport={() => {
                  setReportCategory(null);
                  setIsReporting(true);
                }}
              />
            )}

            {currentTab === 'NOTIFS' && (
              <NotificationsScreen
                onSelectComplaint={(id) => setSelectedComplaintId(id)}
              />
            )}

            {currentTab === 'PROFILE' && (
              <ProfileScreen
                user={user}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </View>

      {/* Custom Stitch Bottom Navigation Bar with Safe Area Inset Support */}
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            height: 58 + Math.max(insets.bottom, 0),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedComplaintId(null);
            setCurrentTab('HOME');
          }}
        >
          <Text style={[styles.navIcon, currentTab === 'HOME' && styles.navActive]}>
            🏠
          </Text>
          <Text
            style={[
              styles.navLabel,
              currentTab === 'HOME' && styles.navLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedComplaintId(null);
            setCurrentTab('COMPLAINTS');
          }}
        >
          <Text
            style={[
              styles.navIcon,
              currentTab === 'COMPLAINTS' && styles.navActive,
            ]}
          >
            📋
          </Text>
          <Text
            style={[
              styles.navLabel,
              currentTab === 'COMPLAINTS' && styles.navLabelActive,
            ]}
          >
            Complaints
          </Text>
        </TouchableOpacity>

        {/* Floating Report Button */}
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => {
            setReportCategory(null);
            setIsReporting(true);
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedComplaintId(null);
            setCurrentTab('NOTIFS');
          }}
        >
          <Text
            style={[styles.navIcon, currentTab === 'NOTIFS' && styles.navActive]}
          >
            🔔
          </Text>
          <Text
            style={[
              styles.navLabel,
              currentTab === 'NOTIFS' && styles.navLabelActive,
            ]}
          >
            Alerts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSelectedComplaintId(null);
            setCurrentTab('PROFILE');
          }}
        >
          <Text
            style={[styles.navIcon, currentTab === 'PROFILE' && styles.navActive]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.navLabel,
              currentTab === 'PROFILE' && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  splashCrest: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  splashTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  header: {
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 18,
  },
  backBtn: {
    paddingRight: 10,
    paddingVertical: 6,
    minWidth: 32,
  },
  backIcon: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  navActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.secondary,
    fontWeight: '700',
  },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: -2,
  },
});
