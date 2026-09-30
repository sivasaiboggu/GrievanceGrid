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

export function FieldWorkerScreen({ user, onLogout }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchWorkOrders = useCallback(async () => {
    try {
      const data = await mobileApi.getWorkOrders();
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load work orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkOrders();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the Field Worker App?', [
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

  const handleUpdateStatus = (orderId, newStatus) => {
    Alert.alert(
      newStatus === 'COMPLETED' ? 'Complete Work Order' : 'Update Progress',
      `Submit on-ground field status as ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(orderId);
            try {
              if (newStatus === 'COMPLETED') {
                await mobileApi.completeWorkOrder(orderId, {
                  remarks: 'On-site remediation completed by field technician. Evidentiary inspection verified.',
                });
              } else {
                await mobileApi.updateWorkOrder(orderId, {
                  remarks: 'Field technician on-site. Remediation actively underway.',
                });
              }
              Alert.alert('Success', 'Work order status updated.');
              fetchWorkOrders();
            } catch (err) {
              Alert.alert('Action Failed', err.message || 'Unable to update work order.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const assignedCount = workOrders.filter((w) => w.status === 'ASSIGNED').length;
  const inProgressCount = workOrders.filter((w) => w.status === 'IN_PROGRESS').length;
  const completedCount = workOrders.filter((w) => w.status === 'COMPLETED').length;

  return (
    <View style={styles.container}>
      {/* Field Worker Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.workerBadge}>
              <Text style={styles.workerBadgeText}>FIELD TECHNICAL STAFF</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>{user?.name || 'Field Technician'}</Text>
          <Text style={styles.headerSubtitle}>On-Ground Work Orders & Evidence</Text>
        </View>
        <TouchableOpacity style={styles.logoutHeaderBtn} onPress={handleLogout}>
          <Text style={styles.logoutHeaderBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{workOrders.length}</Text>
          <Text style={styles.metricLabel}>Total Orders</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#F57C00', borderLeftWidth: 3 }]}>
          <Text style={[styles.metricNumber, { color: '#E65100' }]}>{assignedCount + inProgressCount}</Text>
          <Text style={styles.metricLabel}>Active Jobs</Text>
        </View>
        <View style={[styles.metricCard, { borderLeftColor: '#2E7D32', borderLeftWidth: 3 }]}>
          <Text style={[styles.metricNumber, { color: '#2E7D32' }]}>{completedCount}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : workOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Work Orders Assigned</Text>
            <Text style={styles.emptyDesc}>You currently have no pending field dispatches.</Text>
          </View>
        ) : (
          workOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <Text style={styles.orderId}>{order.id}</Text>
                <View
                  style={[
                    styles.statusTag,
                    order.status === 'COMPLETED' ? styles.statusCompleted : styles.statusActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      order.status === 'COMPLETED' ? styles.statusCompletedText : styles.statusActiveText,
                    ]}
                  >
                    {order.status || 'ASSIGNED'}
                  </Text>
                </View>
              </View>

              <Text style={styles.orderTitle}>
                {order.issue_id ? `Issue: ${order.issue_id}` : `Complaint Docket #${order.complaint_id}`}
              </Text>

              {order.instructions ? (
                <Text style={styles.orderInstructions}>{order.instructions}</Text>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Priority: {order.priority || 'MEDIUM'}</Text>
                <Text style={styles.metaText}>Dept: {order.department_id || 'ROADS'}</Text>
              </View>

              {order.status !== 'COMPLETED' ? (
                <View style={styles.actionRow}>
                  {order.status === 'ASSIGNED' ? (
                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                      disabled={actionLoading === order.id}
                    >
                      <Text style={styles.actionBtnSecondaryText}>Start Work</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => handleUpdateStatus(order.id, 'COMPLETED')}
                    disabled={actionLoading === order.id}
                  >
                    {actionLoading === order.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.actionBtnPrimaryText}>Mark Completed</Text>
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
    marginBottom: 4,
  },
  workerBadge: {
    backgroundColor: '#0277BD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  workerBadgeText: {
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
  orderCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
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
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusCompletedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  orderInstructions: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
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
