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

export function AuthorityDashboardScreen({ user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const data = await mobileApi.getComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load authority metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMonitoringData();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit the Senior Authority Monitoring Dashboard?', [
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

  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
  const urgent = complaints.filter((c) => c.priority === 'URGENT' || c.priority === 'HIGH').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category distribution
  const categoryCounts = complaints.reduce((acc, c) => {
    const cat = c.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Authority Monitoring Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.authorityBadge}>
              <Text style={styles.authorityBadgeText}>SENIOR AUTHORITY OVERSIGHT</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>{user?.name || 'Commissioner'}</Text>
          <Text style={styles.headerSubtitle}>Municipal Performance & SLA Monitoring</Text>
        </View>
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
          <Text style={styles.logoutHeaderBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{total}</Text>
                <Text style={styles.kpiTitle}>Total Filed</Text>
                <Text style={styles.kpiSub}>All Jurisdictions</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: '#2E7D32', borderTopWidth: 3 }]}>
                <Text style={[styles.kpiValue, { color: '#2E7D32' }]}>{resolutionRate}%</Text>
                <Text style={styles.kpiTitle}>Resolution Rate</Text>
                <Text style={styles.kpiSub}>{resolved} Closed</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: '#1976D2', borderTopWidth: 3 }]}>
                <Text style={[styles.kpiValue, { color: '#1976D2' }]}>{inProgress}</Text>
                <Text style={styles.kpiTitle}>Under Action</Text>
                <Text style={styles.kpiSub}>Field Dispatches</Text>
              </View>
              <View style={[styles.kpiCard, { borderTopColor: '#C62828', borderTopWidth: 3 }]}>
                <Text style={[styles.kpiValue, { color: '#C62828' }]}>{urgent}</Text>
                <Text style={styles.kpiTitle}>Priority Cases</Text>
                <Text style={styles.kpiSub}>High Attention</Text>
              </View>
            </View>

            {/* Department Breakdown */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Category Volume Breakdown</Text>
              {Object.keys(categoryCounts).length === 0 ? (
                <Text style={styles.emptyText}>No category records available.</Text>
              ) : (
                Object.entries(categoryCounts).map(([cat, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <View key={cat} style={styles.deptRow}>
                      <View style={styles.deptInfo}>
                        <Text style={styles.deptName}>{cat}</Text>
                        <Text style={styles.deptCount}>{count} cases ({pct}%)</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${pct}%` }]} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Recent High Priority Docket */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Recent Grievances Awaiting Oversight</Text>
              {complaints.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.caseItem}>
                  <View style={styles.caseItemTop}>
                    <Text style={styles.caseTrackingId}>{item.tracking_id || item.id}</Text>
                    <View style={styles.caseStatusBadge}>
                      <Text style={styles.caseStatusBadgeText}>{item.status || 'ACTIVE'}</Text>
                    </View>
                  </View>
                  <Text style={styles.caseItemTitle}>{item.title}</Text>
                  <Text style={styles.caseItemMeta}>
                    📍 {item.location_address || 'Registered Location'} • {item.category || 'General'}
                  </Text>
                </View>
              ))}
            </View>
          </>
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
    marginBottom: 4,
  },
  authorityBadge: {
    backgroundColor: '#8E24AA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  authorityBadgeText: {
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
  content: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  deptRow: {
    marginBottom: spacing.sm,
  },
  deptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deptName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  deptCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0F1E36',
    borderRadius: 3,
  },
  caseItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  caseItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseTrackingId: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#0F1E36',
  },
  caseStatusBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  caseStatusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1565C0',
  },
  caseItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 3,
  },
  caseItemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
