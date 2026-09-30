import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius } from '../theme';
import { mobileApi } from '../api';

export function OfficerPortalScreen({ user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'RESOLVED'
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCases = useCallback(async () => {
    try {
      const data = await mobileApi.getComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load officer cases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit the Municipal Officer Portal?', [
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

  const handleQuickDecision = (complaintId, action) => {
    const actionLabel = action === 'RESOLVE' ? 'Mark Resolved' : 'Assign to Field Team';
    Alert.alert(
      actionLabel,
      `Execute ${actionLabel} for case ${complaintId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(complaintId);
            try {
              await mobileApi.submitOfficerDecision(complaintId, {
                action: action === 'RESOLVE' ? 'RESOLVE' : 'ASSIGN',
                remarks: `Administrative decision executed by ${user?.name || 'Officer'} via Mobile Portal`,
              });
              Alert.alert('Success', `Case successfully updated.`);
              fetchCases();
            } catch (err) {
              Alert.alert('Action Failed', err.message || 'Unable to update case status.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'PENDING') return c.status !== 'RESOLVED';
    if (activeTab === 'RESOLVED') return c.status === 'RESOLVED';
    return true;
  });

  const pendingCount = complaints.filter((c) => c.status !== 'RESOLVED').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <View style={styles.container}>
      {/* Officer Operational Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>MUNICIPAL OFFICER</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>{user?.name || 'Officer'}</Text>
          <Text style={styles.headerSubtitle}>Operational Review & Verification</Text>
        </View>
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
          <Text style={styles.logoutHeaderBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{complaints.length}</Text>
          <Text style={styles.metricLabel}>Total Cases</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#F57C00', borderLeftWidth: 3 }]}>
          <Text style={[styles.metricNumber, { color: '#E65100' }]}>{pendingCount}</Text>
          <Text style={styles.metricLabel}>Pending Action</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#2E7D32', borderLeftWidth: 3 }]}>
          <Text style={[styles.metricNumber, { color: '#2E7D32' }]}>{resolvedCount}</Text>
          <Text style={styles.metricLabel}>Verified Resolved</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ALL' && styles.tabBtnTextActive]}>
            All ({complaints.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PENDING' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'PENDING' && styles.tabBtnTextActive]}>
            Pending Review ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'RESOLVED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('RESOLVED')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'RESOLVED' && styles.tabBtnTextActive]}>
            Resolved ({resolvedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Docket List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredComplaints.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Cases Found</Text>
            <Text style={styles.emptyDesc}>No complaints match the selected operational filter.</Text>
          </View>
        ) : (
          filteredComplaints.map((item) => (
            <View key={item.id} style={styles.caseCard}>
              <View style={styles.caseHeader}>
                <Text style={styles.trackingId}>{item.tracking_id || item.id}</Text>
                <View
                  style={[
                    styles.statusTag,
                    item.status === 'RESOLVED' ? styles.statusResolved : styles.statusActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      item.status === 'RESOLVED' ? styles.statusResolvedText : styles.statusActiveText,
                    ]}
                  >
                    {item.status || 'SUBMITTED'}
                  </Text>
                </View>
              </View>

              <Text style={styles.caseTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.caseDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.caseMetaRow}>
                <Text style={styles.caseMetaText}>
                  📍 {item.location_address || 'Location registered'}
                </Text>
                <Text style={styles.caseMetaText}>
                  📁 {item.category || 'Municipal Grievance'}
                </Text>
              </View>

              {item.status !== 'RESOLVED' ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() => handleQuickDecision(item.id, 'ASSIGN')}
                    disabled={actionLoading === item.id}
                  >
                    <Text style={styles.actionBtnSecondaryText}>Dispatch Field Team</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => handleQuickDecision(item.id, 'RESOLVE')}
                    disabled={actionLoading === item.id}
                  >
                    {actionLoading === item.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.actionBtnPrimaryText}>Verify & Resolve</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#0F1E36',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  logoutHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: '#C62828',
    backgroundColor: '#FFEBEE',
  },
  logoutHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C62828',
  },
  metricsRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.xs,
  },
  tabBtnActive: {
    backgroundColor: '#0F1E36',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  caseCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackingId: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#0F1E36',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  statusActive: {
    backgroundColor: '#FFF3E0',
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
  },
  statusResolved: {
    backgroundColor: '#E8F5E9',
  },
  statusResolvedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  caseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  caseDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  caseMetaRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  caseMetaText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 10,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 36,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 36,
    borderRadius: radius.xs,
    backgroundColor: '#0F1E36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});
