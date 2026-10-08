import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { mobileApi } from '../../api';

export function OfficerComplaintsTab({
  initialFilter = 'ALL',
  onSelectComplaint,
  onOpenCreateWorkOrder,
}) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter); // 'ALL' | 'SUBMITTED' | 'URGENT' | 'AWAITING_VERIFICATION' | 'APPEALED' | 'RESOLVED'
  const [sortUrgent, setSortUrgent] = useState(true);
  const [selectedWard, setSelectedWard] = useState('ALL'); // 'ALL' | 'Ward 14' | 'Ward 4' | 'Ward 9'

  const fetchComplaints = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (activeFilter !== 'ALL' && activeFilter !== 'URGENT') {
        params.status = activeFilter;
      }
      const data = await mobileApi.getComplaints(params);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load complaints in queue:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, activeFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Client-side filtering for urgent and ward if needed
  let displayed = complaints.filter((c) => {
    if (activeFilter === 'URGENT') {
      return (
        (c.priority === 'HIGH' || c.priority === 'URGENT') &&
        c.status !== 'RESOLVED'
      );
    }
    if (activeFilter === 'SUBMITTED') {
      return c.status === 'SUBMITTED';
    }
    if (activeFilter === 'AWAITING_VERIFICATION') {
      return c.status === 'AWAITING_VERIFICATION';
    }
    if (activeFilter === 'APPEALED') {
      return c.status === 'APPEALED';
    }
    if (activeFilter === 'RESOLVED') {
      return c.status === 'RESOLVED';
    }
    return true;
  });

  if (selectedWard !== 'ALL') {
    displayed = displayed.filter(
      (c) => c.location && c.location.toLowerCase().includes(selectedWard.toLowerCase())
    );
  }

  if (sortUrgent) {
    displayed.sort((a, b) => {
      const prioOrder = { URGENT: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
      const pA = prioOrder[a.priority] || 1;
      const pB = prioOrder[b.priority] || 1;
      return pB - pA;
    });
  }

  const unassignedCount = complaints.filter((c) => c.status === 'SUBMITTED').length;
  const urgentCount = complaints.filter((c) => (c.priority === 'HIGH' || c.priority === 'URGENT') && c.status !== 'RESOLVED').length;
  const awaitingCount = complaints.filter((c) => c.status === 'AWAITING_VERIFICATION').length;
  const appealsCount = complaints.filter((c) => c.status === 'APPEALED').length;

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Case ID, keyword, or ward..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
              All Active ({complaints.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'SUBMITTED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('SUBMITTED')}
          >
            <View style={styles.chipDotRed} />
            <Text style={[styles.filterChipText, activeFilter === 'SUBMITTED' && styles.filterChipTextActive]}>
              Unassigned ({unassignedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'URGENT' && styles.filterChipActive]}
            onPress={() => setActiveFilter('URGENT')}
          >
            <Text style={{ fontSize: 11 }}>⏱️</Text>
            <Text style={[styles.filterChipText, activeFilter === 'URGENT' && styles.filterChipTextActive]}>
              SLA Urgent ({urgentCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'AWAITING_VERIFICATION' && styles.filterChipActive]}
            onPress={() => setActiveFilter('AWAITING_VERIFICATION')}
          >
            <Text style={{ fontSize: 11 }}>🛡️</Text>
            <Text style={[styles.filterChipText, activeFilter === 'AWAITING_VERIFICATION' && styles.filterChipTextActive]}>
              Awaiting Sign-off ({awaitingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'APPEALED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('APPEALED')}
          >
            <Text style={{ fontSize: 11 }}>⚠️</Text>
            <Text style={[styles.filterChipText, activeFilter === 'APPEALED' && styles.filterChipTextActive]}>
              Appeals ({appealsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'RESOLVED' && styles.filterChipActive]}
            onPress={() => setActiveFilter('RESOLVED')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'RESOLVED' && styles.filterChipTextActive]}>
              Resolved
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sub-bar: Count & Toggles */}
      <View style={styles.subBar}>
        <Text style={styles.subBarCount}>
          Showing {displayed.length} operational {displayed.length === 1 ? 'docket' : 'dockets'}
        </Text>
        <View style={styles.subBarActions}>
          <TouchableOpacity
            style={[styles.subBarBtn, selectedWard !== 'ALL' && styles.subBarBtnActive]}
            onPress={() => {
              const wards = ['ALL', 'Ward 14', 'Ward 4', 'Ward 9'];
              const nextIdx = (wards.indexOf(selectedWard) + 1) % wards.length;
              setSelectedWard(wards[nextIdx]);
            }}
          >
            <Text style={styles.subBarBtnText}>
              {selectedWard === 'ALL' ? 'All Wards' : selectedWard}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subBarBtn, sortUrgent && styles.subBarBtnActive]}
            onPress={() => setSortUrgent(!sortUrgent)}
          >
            <Text style={styles.subBarBtnText}>
              {sortUrgent ? '⚡ Urgency' : '🕒 Date'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Complaints List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchComplaints();
            }}
            colors={[colors.secondary]}
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 40 }} />
        ) : displayed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No Complaints Found</Text>
            <Text style={styles.emptyDesc}>
              No municipal dockets match the applied filters or keyword query.
            </Text>
          </View>
        ) : (
          displayed.map((item) => {
            const isCritical = item.priority === 'HIGH' || item.priority === 'URGENT';
            const isAwaiting = item.status === 'AWAITING_VERIFICATION';
            const isResolved = item.status === 'RESOLVED';
            const isAppealed = item.status === 'APPEALED';

            return (
              <View key={item.id} style={styles.complaintCard}>
                {/* Accent border strip */}
                <View
                  style={[
                    styles.cardAccent,
                    {
                      backgroundColor: isAppealed
                        ? colors.error
                        : isCritical
                        ? '#B91C1C'
                        : isAwaiting
                        ? colors.secondary
                        : colors.primaryContainer,
                    },
                  ]}
                />

                <View style={styles.cardMain}>
                  {/* Top Bar: Tracking ID, SLA tag, and intake channel */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIdRow}>
                      <Text style={styles.cardTrackingId}>{item.tracking_id || item.id}</Text>
                      {isCritical && !isResolved ? (
                        <View style={styles.slaBadge}>
                          <Text style={styles.slaBadgeText}>
                            {item.priority} PRIORITY
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        isResolved
                          ? styles.statusPillResolved
                          : isAwaiting
                          ? styles.statusPillAwaiting
                          : isAppealed
                          ? styles.statusPillAppealed
                          : styles.statusPillDefault,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isResolved
                            ? styles.statusPillTextResolved
                            : isAwaiting
                            ? styles.statusPillTextAwaiting
                            : isAppealed
                            ? styles.statusPillTextAppealed
                            : styles.statusPillTextDefault,
                        ]}
                      >
                        {item.status || 'SUBMITTED'}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Description */}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  {/* Location & Metadata Row */}
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardMetaItem}>
                      📍 {item.location || 'Central Municipal Sector'}
                    </Text>
                    <Text style={styles.cardMetaItem}>
                      📁 {item.category || 'General Civic'}
                    </Text>
                  </View>

                  {/* Sub-issues and Department Tag */}
                  <View style={styles.subIssuesRow}>
                    <View style={styles.subIssueCountPill}>
                      <Text style={styles.subIssueCountText}>
                        Decomposed Issues: {item.sub_issues_count || 1}
                      </Text>
                    </View>
                    {item.assigned_department ? (
                      <View style={styles.deptPill}>
                        <Text style={styles.deptPillText}>
                          {item.assigned_department}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.unroutedPill}>
                        <Text style={styles.unroutedPillText}>Needs Department Route</Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => onSelectComplaint(item.id)}
                    >
                      <Text style={styles.detailBtnText}>
                        {isAwaiting
                          ? '🛡️ Sign-off Case'
                          : isAppealed
                          ? '⚠️ Review Appeal'
                          : '🔍 Inspect / Triage'}
                      </Text>
                    </TouchableOpacity>

                    {item.status !== 'RESOLVED' && onOpenCreateWorkOrder ? (
                      <TouchableOpacity
                        style={styles.dispatchBtn}
                        onPress={() => onOpenCreateWorkOrder(item.id)}
                      >
                        <Text style={styles.dispatchBtnText}>Assign Crew</Text>
                      </TouchableOpacity>
                    ) : null}
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
  searchHeader: {
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textMuted,
    padding: 4,
  },
  filterChipsScroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 4,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  chipDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subBarCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subBarActions: {
    flexDirection: 'row',
    gap: 6,
  },
  subBarBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subBarBtnActive: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.secondaryContainer,
  },
  subBarBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
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
    marginBottom: spacing.xs,
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
    marginTop: 4,
  },
  complaintCard: {
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
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardMain: {
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTrackingId: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: colors.primary,
  },
  slaBadge: {
    backgroundColor: colors.errorBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  slaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.error,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusPillDefault: {
    backgroundColor: colors.surfaceContainerLow,
  },
  statusPillTextDefault: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statusPillAwaiting: {
    backgroundColor: colors.secondaryFixed,
  },
  statusPillTextAwaiting: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  statusPillAppealed: {
    backgroundColor: colors.errorBg,
  },
  statusPillTextAppealed: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.error,
  },
  statusPillResolved: {
    backgroundColor: colors.successBg,
  },
  statusPillTextResolved: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  cardMetaItem: {
    fontSize: 10,
    color: colors.textMuted,
    flexShrink: 1,
  },
  subIssuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  subIssueCountPill: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subIssueCountText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },
  deptPill: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deptPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.primary,
  },
  unroutedPill: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unroutedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warning,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  detailBtn: {
    flex: 1,
    height: 36,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  dispatchBtn: {
    paddingHorizontal: 12,
    height: 36,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
