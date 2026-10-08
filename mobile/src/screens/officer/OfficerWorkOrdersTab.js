import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { mobileApi } from '../../api';

export function OfficerWorkOrdersTab({
  onSelectComplaint,
  onVerifyWorkOrder,
  onSelectWorkOrder,
}) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'

  const fetchWorkOrders = useCallback(async () => {
    try {
      const params = {};
      if (activeFilter !== 'ALL') {
        params.status = activeFilter;
      }
      const data = await mobileApi.getWorkOrders(params);
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load work orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const awaitingSignoff = workOrders.filter(
    (w) => w.status === 'COMPLETED' || w.complaint_status === 'AWAITING_VERIFICATION'
  );

  return (
    <View style={styles.container}>
      {/* Header Bar with Filter Chips */}
      <View style={styles.headerBar}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Work Orders & Dispatch</Text>
          <View style={styles.orderCountBadge}>
            <Text style={styles.orderCountBadgeText}>{workOrders.length} ORDERS</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterBtn, activeFilter === 'ALL' && styles.filterBtnActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterBtnText, activeFilter === 'ALL' && styles.filterBtnTextActive]}>
              All ({workOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, activeFilter === 'COMPLETED' && styles.filterBtnActive]}
            onPress={() => setActiveFilter('COMPLETED')}
          >
            <View style={styles.chipDotBlue} />
            <Text style={[styles.filterBtnText, activeFilter === 'COMPLETED' && styles.filterBtnTextActive]}>
              Awaiting Sign-off ({awaitingSignoff.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, activeFilter === 'IN_PROGRESS' && styles.filterBtnActive]}
            onPress={() => setActiveFilter('IN_PROGRESS')}
          >
            <Text style={[styles.filterBtnText, activeFilter === 'IN_PROGRESS' && styles.filterBtnTextActive]}>
              In Progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, activeFilter === 'ASSIGNED' && styles.filterBtnActive]}
            onPress={() => setActiveFilter('ASSIGNED')}
          >
            <Text style={[styles.filterBtnText, activeFilter === 'ASSIGNED' && styles.filterBtnTextActive]}>
              Assigned
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchWorkOrders();
            }}
            colors={[colors.secondary]}
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 40 }} />
        ) : workOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🛠️</Text>
            <Text style={styles.emptyTitle}>No Work Orders in Queue</Text>
            <Text style={styles.emptyDesc}>
              No dispatched work orders match the current filter selection.
            </Text>
          </View>
        ) : (
          workOrders.map((wo) => {
            const isCompleted =
              wo.status === 'COMPLETED' || wo.complaint_status === 'AWAITING_VERIFICATION';
            const isCritical = wo.priority === 'HIGH' || wo.priority === 'URGENT';

            return (
              <View key={wo.id} style={styles.orderCard}>
                <View
                  style={[
                    styles.accentLeft,
                    {
                      backgroundColor: isCompleted
                        ? colors.secondary
                        : isCritical
                        ? colors.warning
                        : colors.primaryContainer,
                    },
                  ]}
                />

                <View style={styles.cardBody}>
                  {/* Top Bar: Order ID, Priority, and Status */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.orderIdGroup}>
                      <Text style={styles.orderIdText}>{wo.id.toUpperCase()}</Text>
                      <Text style={styles.orderCaseId}>
                        • {wo.complaint_tracking_id || wo.complaint_id}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        isCompleted
                          ? styles.statusTagCompleted
                          : wo.status === 'IN_PROGRESS'
                          ? styles.statusTagProgress
                          : styles.statusTagAssigned,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          isCompleted
                            ? styles.statusTagTextCompleted
                            : wo.status === 'IN_PROGRESS'
                            ? styles.statusTagTextProgress
                            : styles.statusTagTextAssigned,
                        ]}
                      >
                        {isCompleted
                          ? 'Awaiting Sign-off'
                          : wo.status === 'IN_PROGRESS'
                          ? 'In Progress'
                          : 'Assigned'}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Instructions */}
                  <Text style={styles.orderTitle}>
                    {wo.complaint_title || 'Civic Infrastructure Remediation'}
                  </Text>
                  {wo.instructions ? (
                    <Text style={styles.instructionsText} numberOfLines={2}>
                      Directive: {wo.instructions}
                    </Text>
                  ) : null}

                  {/* Location & Dept */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      📍 {wo.complaint_location || 'Precinct Grid'}
                    </Text>
                    <Text style={styles.metaText}>
                      🏛️ {wo.department_name || wo.department_id}
                    </Text>
                  </View>

                  {/* Crew & Response Notes */}
                  <View style={styles.crewRow}>
                    <View style={styles.crewPill}>
                      <Text style={styles.crewIcon}>👷</Text>
                      <Text style={styles.crewText}>{wo.assigned_worker_name}</Text>
                    </View>
                    {wo.completed_at ? (
                      <Text style={styles.timestampText}>
                        Closed at {wo.completed_at.slice(11, 16)}
                      </Text>
                    ) : null}
                  </View>

                  {wo.response_text ? (
                    <View style={styles.responseNoteBox}>
                      <Text style={styles.responseNoteTitle}>Worker Completion Log:</Text>
                      <Text style={styles.responseNoteDesc}>{wo.response_text}</Text>
                    </View>
                  ) : null}

                  {/* Actions */}
                  <View style={styles.actionButtonsRow}>
                    {isCompleted && onVerifyWorkOrder ? (
                      <TouchableOpacity
                        style={styles.verifyBtn}
                        onPress={() => onVerifyWorkOrder(wo)}
                      >
                        <Text style={styles.verifyBtnText}>🛡️ Verify Work Sign-Off</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.viewComplaintBtn}
                      onPress={() => onSelectComplaint(wo.complaint_id)}
                    >
                      <Text style={styles.viewComplaintBtnText}>View Docket</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
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
  headerBar: {
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  orderCountBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  orderCountBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    paddingBottom: 4,
    gap: spacing.xs,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    gap: 4,
  },
  filterBtnActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  chipDotBlue: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  accentLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardBody: {
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: colors.primary,
  },
  orderCaseId: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusTagCompleted: {
    backgroundColor: colors.secondaryFixed,
  },
  statusTagTextCompleted: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  statusTagProgress: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  statusTagTextProgress: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  statusTagAssigned: {
    backgroundColor: colors.surfaceContainerLow,
  },
  statusTagTextAssigned: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  orderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  instructionsText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  metaText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  crewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  crewIcon: {
    fontSize: 11,
  },
  crewText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  timestampText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  responseNoteBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.xs,
    borderRadius: radius.xs,
    marginTop: 6,
  },
  responseNoteTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 1,
  },
  responseNoteDesc: {
    fontSize: 10,
    color: colors.text,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  verifyBtn: {
    flex: 1,
    height: 36,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  viewComplaintBtn: {
    paddingHorizontal: 12,
    height: 36,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewComplaintBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
});
