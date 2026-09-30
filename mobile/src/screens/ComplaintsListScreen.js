import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { mobileApi } from '../api';

export function ComplaintsListScreen({ onSelectComplaint, onStartReport }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadComplaints = async () => {
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const data = await mobileApi.getComplaints(params);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load grievance records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, search]);

  const tabs = [
    { id: '', label: 'All' },
    { id: 'SUBMITTED', label: 'Submitted' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'RESOLVED', label: 'Resolved' },
    { id: 'APPEALED', label: 'Appealed' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return { bg: colors.successBg, text: colors.success };
      case 'IN_PROGRESS':
        return { bg: colors.warningBg, text: colors.warning };
      case 'APPEALED':
        return { bg: colors.surfaceDim, text: colors.secondary };
      default:
        return { bg: colors.surfaceContainerLow, text: colors.secondary };
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by ID, category, or address..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, statusFilter === t.id && styles.tabActive]}
            onPress={() => setStatusFilter(t.id)}
          >
            <Text
              style={[styles.tabText, statusFilter === t.id && styles.tabTextActive]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadComplaints}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* List */}
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadComplaints();
            }}
            colors={[colors.secondary]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
              <Text style={styles.emptyTitle}>No Grievances Found</Text>
              <Text style={styles.emptySubtitle}>
                {search || statusFilter
                  ? 'No filings match your current filter criteria.'
                  : 'You have not submitted any municipal grievances yet.'}
              </Text>
              {onStartReport && !search && !statusFilter && (
                <TouchableOpacity style={styles.newReportBtn} onPress={onStartReport}>
                  <Text style={styles.newReportBtnText}>+ Report an Infrastructure Problem</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={({ item }) => {
          const badgeStyle = getStatusBadge(item.status);
          const tracking = item.tracking_id || item.tracking_number || item.id;
          const loc = item.location || item.address_text || 'Central Municipal District';
          const subCount = item.sub_issues_count || (item.issues ? item.issues.length : 1);

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectComplaint(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.trackingId}>{tracking}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={[styles.statusText, { color: badgeStyle.text }]}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <Text style={styles.categoryTitle}>{item.category}</Text>

              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText} numberOfLines={1}>
                  📍 {loc}
                </Text>
                <Text style={styles.subIssueText}>
                  {subCount} {subCount === 1 ? 'branch' : 'branches'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBox: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    height: 44,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primaryContainer,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: radius.md,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.error,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackingId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
  desc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    marginRight: 6,
  },
  subIssueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  newReportBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newReportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
