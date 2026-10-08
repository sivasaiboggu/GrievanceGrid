import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { OfficerOverviewTab } from './officer/OfficerOverviewTab';
import { OfficerComplaintsTab } from './officer/OfficerComplaintsTab';
import { OfficerWorkOrdersTab } from './officer/OfficerWorkOrdersTab';
import { OfficerNotificationsTab } from './officer/OfficerNotificationsTab';
import { OfficerProfileTab } from './officer/OfficerProfileTab';
import { OfficerComplaintDetailScreen } from './officer/OfficerComplaintDetailScreen';
import { OfficerEvidenceReviewScreen } from './officer/OfficerEvidenceReviewScreen';
import { OfficerDecisionScreen } from './officer/OfficerDecisionScreen';
import { OfficerWorkOrderDispatchModal } from './officer/OfficerWorkOrderDispatchModal';

// Active Bottom Tab Enums
const TABS = {
  OVERVIEW: 'OVERVIEW',
  COMPLAINTS: 'COMPLAINTS',
  WORK_ORDERS: 'WORK_ORDERS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  PROFILE: 'PROFILE',
};

export function OfficerPortalScreen({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);

  // Stack navigation states
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [selectedComplaintData, setSelectedComplaintData] = useState(null);
  const [evidenceScreenData, setEvidenceScreenData] = useState(null); // { complaint, attachment }
  const [decisionScreenData, setDecisionScreenData] = useState(null); // { complaint, workOrder }

  // Dispatch Modal state
  const [dispatchModalData, setDispatchModalData] = useState(null); // { complaint, issue }

  // Hardware back button support for Android
  useEffect(() => {
    const onBackPress = () => {
      if (evidenceScreenData) {
        setEvidenceScreenData(null);
        return true;
      }
      if (decisionScreenData) {
        setDecisionScreenData(null);
        return true;
      }
      if (selectedComplaintId) {
        setSelectedComplaintId(null);
        setSelectedComplaintData(null);
        return true;
      }
      if (activeTab !== TABS.OVERVIEW) {
        setActiveTab(TABS.OVERVIEW);
        return true;
      }
      return false; // Default Android back behavior (exits or bubbles)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [evidenceScreenData, decisionScreenData, selectedComplaintId, activeTab]);

  const handleSelectComplaint = (complaintId, optionalData = null) => {
    setSelectedComplaintId(complaintId);
    if (optionalData) {
      setSelectedComplaintData(optionalData);
    }
  };

  const handleOpenEvidence = (complaint, attachment) => {
    setEvidenceScreenData({ complaint, attachment });
  };

  const handleOpenDecision = (complaint, workOrder = null) => {
    setDecisionScreenData({ complaint, workOrder });
  };

  const handleOpenDispatch = (complaint, issue = null) => {
    setDispatchModalData({ complaint, issue });
  };

  // 1. Stack: Evidence Review Screen
  if (evidenceScreenData) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <OfficerEvidenceReviewScreen
          complaint={evidenceScreenData.complaint}
          attachment={evidenceScreenData.attachment}
          onBack={() => setEvidenceScreenData(null)}
        />
      </SafeAreaView>
    );
  }

  // 2. Stack: Response Verification & Case Decision Screen
  if (decisionScreenData) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <OfficerDecisionScreen
          complaint={decisionScreenData.complaint}
          workOrder={decisionScreenData.workOrder}
          user={user}
          onBack={() => setDecisionScreenData(null)}
          onDecisionComplete={() => {
            setDecisionScreenData(null);
            setSelectedComplaintId(null);
            setSelectedComplaintData(null);
            setActiveTab(TABS.COMPLAINTS);
          }}
        />
      </SafeAreaView>
    );
  }

  // 3. Stack: Complaint Detail Screen
  if (selectedComplaintId) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <OfficerComplaintDetailScreen
          complaintId={selectedComplaintId}
          user={user}
          onBack={() => {
            setSelectedComplaintId(null);
            setSelectedComplaintData(null);
          }}
          onOpenEvidence={handleOpenEvidence}
          onOpenDecision={handleOpenDecision}
          onOpenDispatch={handleOpenDispatch}
        />

        {/* Dispatch Modal */}
        {dispatchModalData && (
          <OfficerWorkOrderDispatchModal
            visible={!!dispatchModalData}
            complaint={dispatchModalData.complaint}
            issue={dispatchModalData.issue}
            onClose={() => setDispatchModalData(null)}
            onSuccess={() => setDispatchModalData(null)}
          />
        )}
      </SafeAreaView>
    );
  }

  // 4. Tab Screens
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.OVERVIEW:
        return (
          <OfficerOverviewTab
            user={user}
            onSelectComplaint={handleSelectComplaint}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenSearch={() => setActiveTab(TABS.COMPLAINTS)}
          />
        );
      case TABS.COMPLAINTS:
        return (
          <OfficerComplaintsTab
            user={user}
            onSelectComplaint={handleSelectComplaint}
          />
        );
      case TABS.WORK_ORDERS:
        return (
          <OfficerWorkOrdersTab
            onSelectComplaint={handleSelectComplaint}
            onVerifyWorkOrder={(workOrder) => {
              // Load complaint context and open decision
              handleOpenDecision({ id: workOrder.complaint_id, tracking_id: workOrder.complaint_tracking_id }, workOrder);
            }}
            onSelectWorkOrder={(workOrder) => {
              if (workOrder.complaint_id) {
                handleSelectComplaint(workOrder.complaint_id);
              }
            }}
          />
        );
      case TABS.NOTIFICATIONS:
        return (
          <OfficerNotificationsTab
            onSelectComplaint={handleSelectComplaint}
          />
        );
      case TABS.PROFILE:
        return (
          <OfficerProfileTab
            user={user}
            onLogout={onLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Main Tab Content */}
      <View style={styles.tabContentWrap}>
        {renderTabContent()}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Tab: Overview */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab(TABS.OVERVIEW)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === TABS.OVERVIEW && styles.navIconActive]}>
            📊
          </Text>
          <Text style={[styles.navLabel, activeTab === TABS.OVERVIEW && styles.navLabelActive]}>
            Overview
          </Text>
        </TouchableOpacity>

        {/* Tab: Complaints */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab(TABS.COMPLAINTS)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === TABS.COMPLAINTS && styles.navIconActive]}>
            📋
          </Text>
          <Text style={[styles.navLabel, activeTab === TABS.COMPLAINTS && styles.navLabelActive]}>
            Complaints
          </Text>
        </TouchableOpacity>

        {/* Tab: Work Orders */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab(TABS.WORK_ORDERS)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === TABS.WORK_ORDERS && styles.navIconActive]}>
            🛠️
          </Text>
          <Text style={[styles.navLabel, activeTab === TABS.WORK_ORDERS && styles.navLabelActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        {/* Tab: Notifications */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab(TABS.NOTIFICATIONS)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === TABS.NOTIFICATIONS && styles.navIconActive]}>
            🔔
          </Text>
          <Text style={[styles.navLabel, activeTab === TABS.NOTIFICATIONS && styles.navLabelActive]}>
            Notices
          </Text>
        </TouchableOpacity>

        {/* Tab: Profile */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab(TABS.PROFILE)}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === TABS.PROFILE && styles.navIconActive]}>
            👤
          </Text>
          <Text style={[styles.navLabel, activeTab === TABS.PROFILE && styles.navLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dispatch Modal (if opened from list/tabs) */}
      {dispatchModalData && (
        <OfficerWorkOrderDispatchModal
          visible={!!dispatchModalData}
          complaint={dispatchModalData.complaint}
          issue={dispatchModalData.issue}
          onClose={() => setDispatchModalData(null)}
          onSuccess={() => setDispatchModalData(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContentWrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bottomNav: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
