import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { mobileApi } from '../../api';

export function OfficerOverviewTab({
  user,
  onSelectComplaint,
  onNavigateTab,
  onOpenSearch,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      setError(null);
      const res = await mobileApi.getOfficerOverview();
      setData(res);
    } catch (err) {
      console.warn('Failed to load officer overview:', err);
      setError(err.message || 'Unable to connect to municipal ledger.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const stats = data?.stats || {
    needs_triage: 0,
    in_progress: 0,
    awaiting_verification: 0,
    appeals: 0,
    total_active: 0,
  };

  const needsAttention = data?.needs_attention || [];
  const recentDockets = data?.recent_dockets || [];

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Syncing Municipal Ledger...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchOverview();
          }}
          colors={[colors.secondary]}
        />
      }
    >
      {/* Officer Context & Greeting */}
      <View style={styles.greetingSection}>
        <View style={styles.syncRow}>
          <View style={styles.syncPill}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>CIVIC LEDGER SYNCED</Text>
          </View>
          <Text style={styles.syncTime}>Shift Active (06:00 - 18:00)</Text>
        </View>
        <Text style={styles.greetingTitle}>
          Good day, Officer {user?.name ? user.name.split(' ')[0] : 'Brody'}
        </Text>
        <Text style={styles.greetingSubtitle}>
          Central Precinct 04 • {user?.role || 'GRO-III Operational Review'}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>Ledger Connection Notice</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOverview}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Operational Status Indicators Grid */}
      <View style={styles.metricsGrid}>
        {/* Needs Triage */}
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.8}
          onPress={() => onNavigateTab && onNavigateTab('COMPLAINTS', 'SUBMITTED')}
        >
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>Needs Triage</Text>
            <Text style={styles.metricIcon}>📥</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{stats.needs_triage}</Text>
            <Text style={styles.metricSub}>unassigned</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(10, stats.needs_triage * 10))}%`,
                  backgroundColor: colors.secondary,
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* In Progress */}
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.8}
          onPress={() => onNavigateTab && onNavigateTab('COMPLAINTS', 'IN_PROGRESS')}
        >
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>In Progress</Text>
            <Text style={styles.metricIcon}>⚙️</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{stats.in_progress}</Text>
            <Text style={styles.metricSub}>field active</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(10, stats.in_progress * 5))}%`,
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Awaiting Verification */}
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.8}
          onPress={() => onNavigateTab && onNavigateTab('COMPLAINTS', 'AWAITING_VERIFICATION')}
        >
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>Awaiting Sign-off</Text>
            <Text style={styles.metricIcon}>🛡️</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: colors.secondary }]}>
              {stats.awaiting_verification}
            </Text>
            <Text style={[styles.metricSub, { color: colors.secondary, fontWeight: '700' }]}>
              crew closed
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(10, stats.awaiting_verification * 15))}%`,
                  backgroundColor: colors.secondaryContainer,
                },
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Appeals */}
        <TouchableOpacity
          style={styles.metricCard}
          activeOpacity={0.8}
          onPress={() => onNavigateTab && onNavigateTab('COMPLAINTS', 'APPEALED')}
        >
          <View style={styles.metricTop}>
            <Text style={styles.metricLabel}>Appeals</Text>
            <Text style={styles.metricIcon}>⚠️</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={[styles.metricValue, { color: colors.error }]}>
              {stats.appeals}
            </Text>
            <Text style={[styles.metricSub, { color: colors.error, fontWeight: '700' }]}>
              citizen escalated
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(10, stats.appeals * 25))}%`,
                  backgroundColor: colors.error,
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Section 1: Needs Immediate Attention */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Needs Immediate Attention</Text>
          {needsAttention.length > 0 ? (
            <View style={styles.badgeCritical}>
              <Text style={styles.badgeCriticalText}>
                {needsAttention.length} ACTIONABLE
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => onNavigateTab && onNavigateTab('COMPLAINTS')}
        >
          <Text style={styles.viewAllLink}>View All ({stats.total_active})</Text>
        </TouchableOpacity>
      </View>

      {needsAttention.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>Queue Clear</Text>
          <Text style={styles.emptyDesc}>
            No urgent SLA breaches or unassigned dockets requiring immediate intervention.
          </Text>
        </View>
      ) : (
        needsAttention.map((item) => {
          const isAwaiting = item.status === 'AWAITING_VERIFICATION';
          const isAppealed = item.status === 'APPEALED';

          return (
            <View key={item.id} style={styles.actionCard}>
              {/* Severity accent strip */}
              <View
                style={[
                  styles.cardAccentStrip,
                  {
                    backgroundColor: isAppealed
                      ? colors.error
                      : isAwaiting
                      ? colors.secondary
                      : colors.warning,
                  },
                ]}
              />

              <View style={styles.actionCardContent}>
                {/* Header: Tracking ID + Status Tag */}
                <View style={styles.docketHeaderRow}>
                  <Text style={styles.trackingIdText}>{item.tracking_id || item.id}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      isAppealed
                        ? styles.statusPillError
                        : isAwaiting
                        ? styles.statusPillSecondary
                        : styles.statusPillWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isAppealed
                          ? styles.statusPillTextError
                          : isAwaiting
                          ? styles.statusPillTextSecondary
                          : styles.statusPillTextWarning,
                      ]}
                    >
                      {isAppealed
                        ? 'Citizen Appeal'
                        : isAwaiting
                        ? 'Awaiting Sign-off'
                        : `${item.priority || 'MEDIUM'} SLA`}
                    </Text>
                  </View>
                </View>

                {/* Title & Location */}
                <Text style={styles.docketTitle}>{item.title}</Text>
                <View style={styles.locationRow}>
                  <Text style={styles.metaIcon}>📍</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.location || 'Precinct Grid 4'}
                  </Text>
                </View>

                {/* Worker / Appeal Context Note */}
                {isAppealed ? (
                  <View style={styles.appealCallout}>
                    <Text style={styles.appealCalloutIcon}>⚠️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appealCalloutTitle}>Citizen Dispute Logged</Text>
                      <Text style={styles.appealCalloutDesc} numberOfLines={2}>
                        {item.appeal_reason || 'Constituent reports residual physical remediation required.'}
                      </Text>
                    </View>
                  </View>
                ) : isAwaiting ? (
                  <View style={styles.workOrderCallout}>
                    <Text style={styles.workOrderCalloutIcon}>🛠️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.workOrderCalloutTitle}>
                        Field Work Completed • Sign-off Required
                      </Text>
                      <Text style={styles.workOrderCalloutDesc}>
                        Work Order #{item.work_order_id || 'WO-8821'} submitted completion log. Verification pending.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.neutralCallout}>
                    <Text style={styles.neutralCalloutText}>
                      Sub-issues registered: {item.sub_issues_count || 1} • Triage needed
                    </Text>
                  </View>
                )}

                {/* CTA Action Bar */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.primaryActionBtn}
                    onPress={() => onSelectComplaint(item.id)}
                  >
                    <Text style={styles.primaryActionBtnText}>
                      {isAwaiting
                        ? '🛡️ Verify Work Sign-Off'
                        : isAppealed
                        ? '📂 Review Appeal Dossier'
                        : '🔍 Inspect & Triage Case'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* Section 2: Recent Precinct Dockets */}
      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Recent Precinct Dockets</Text>
          <Text style={styles.precinctTag}>(Sector 4C)</Text>
        </View>
        <TouchableOpacity
          onPress={() => onNavigateTab && onNavigateTab('COMPLAINTS')}
        >
          <Text style={styles.viewAllLink}>View All ({recentDockets.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.miniList}>
        {recentDockets.slice(0, 5).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.miniListItem}
            activeOpacity={0.7}
            onPress={() => onSelectComplaint(item.id)}
          >
            <View style={styles.miniListLeft}>
              <View style={styles.categoryBadgeSquare}>
                <Text style={{ fontSize: 16 }}>
                  {item.category?.includes('Road')
                    ? '🛣️'
                    : item.category?.includes('Light')
                    ? '💡'
                    : item.category?.includes('Waste') || item.category?.includes('Garbage')
                    ? '🗑️'
                    : item.category?.includes('Drain')
                    ? '🌊'
                    : '🏛️'}
                </Text>
              </View>
              <View style={styles.miniListInfo}>
                <View style={styles.miniListMetaRow}>
                  <Text style={styles.miniListTracking}>{item.tracking_id || item.id}</Text>
                  <Text style={styles.miniListBullet}>•</Text>
                  <Text style={styles.miniListTime}>
                    {item.created_at ? item.created_at.slice(0, 10) : 'Recent'}
                  </Text>
                </View>
                <Text style={styles.miniListTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.miniListTagsRow}>
                  <View style={styles.miniDeptTag}>
                    <Text style={styles.miniDeptTagText}>
                      {item.category || 'General'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.miniStatusTag,
                      item.status === 'RESOLVED' && { backgroundColor: colors.successBg },
                      item.status === 'AWAITING_VERIFICATION' && { backgroundColor: colors.secondaryFixed },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniStatusTagText,
                        item.status === 'RESOLVED' && { color: colors.success },
                        item.status === 'AWAITING_VERIFICATION' && { color: colors.secondary },
                      ]}
                    >
                      {item.status || 'SUBMITTED'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Case Lookup Trigger */}
      <TouchableOpacity
        style={styles.searchTriggerBar}
        activeOpacity={0.8}
        onPress={() => (onOpenSearch ? onOpenSearch() : onNavigateTab('COMPLAINTS'))}
      >
        <View style={styles.searchTriggerLeft}>
          <Text style={styles.searchTriggerIcon}>🔍</Text>
          <Text style={styles.searchTriggerText}>Search by Docket # or Citizen ID</Text>
        </View>
        <View style={styles.searchTriggerKbd}>
          <Text style={styles.searchTriggerKbdText}>CASE FINDER</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  greetingSection: {
    marginBottom: spacing.md,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 5,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  syncTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
  errorSubtitle: {
    fontSize: 11,
    color: colors.text,
    marginTop: 1,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.error,
    borderRadius: radius.xs,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  metricIcon: {
    fontSize: 14,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  metricSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  precinctTag: {
    fontSize: 11,
    color: colors.textMuted,
  },
  badgeCritical: {
    backgroundColor: colors.errorBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeCriticalText: {
    color: colors.error,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  viewAllLink: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  actionCardContent: {
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  docketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trackingIdText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusPillWarning: {
    backgroundColor: colors.warningBg,
  },
  statusPillTextWarning: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillSecondary: {
    backgroundColor: colors.secondaryFixed,
  },
  statusPillTextSecondary: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillError: {
    backgroundColor: colors.errorBg,
  },
  statusPillTextError: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '700',
  },
  docketTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  metaIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  appealCallout: {
    flexDirection: 'row',
    backgroundColor: colors.errorBg,
    borderRadius: radius.xs,
    padding: spacing.xs,
    gap: spacing.xs,
    marginTop: 4,
  },
  appealCalloutIcon: {
    fontSize: 14,
  },
  appealCalloutTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
  },
  appealCalloutDesc: {
    fontSize: 10,
    color: colors.text,
    marginTop: 1,
  },
  workOrderCallout: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xs,
    padding: spacing.xs,
    gap: spacing.xs,
    marginTop: 4,
  },
  workOrderCalloutIcon: {
    fontSize: 14,
  },
  workOrderCalloutTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  workOrderCalloutDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  neutralCallout: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    marginTop: 4,
  },
  neutralCalloutText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  cardActionsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionBtn: {
    flex: 1,
    height: 38,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  miniList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  miniListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryBadgeSquare: {
    width: 36,
    height: 36,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniListInfo: {
    flex: 1,
  },
  miniListMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniListTracking: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textMuted,
  },
  miniListBullet: {
    fontSize: 10,
    color: colors.textMuted,
  },
  miniListTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  miniListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 1,
  },
  miniListTagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  miniDeptTag: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  miniDeptTagText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  miniStatusTag: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  miniStatusTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  chevronIcon: {
    fontSize: 18,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  searchTriggerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  searchTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchTriggerIcon: {
    fontSize: 14,
  },
  searchTriggerText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  searchTriggerKbd: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchTriggerKbdText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
});
