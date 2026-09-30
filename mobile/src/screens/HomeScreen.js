import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { mobileApi } from '../api';

export function HomeScreen({ onStartReport, onViewComplaints, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setError(null);
    try {
      const data = await mobileApi.getComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not connect to civic service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = complaints.filter((c) => c.status !== 'RESOLVED').length;
  const recent = complaints.slice(0, 3);

  const categories = [
    { id: 'Road Damage', icon: '🛣️', title: 'Road Damage' },
    { id: 'Streetlight Issues', icon: '💡', title: 'Streetlight' },
    { id: 'Garbage & Waste', icon: '🗑️', title: 'Garbage' },
    { id: 'Drainage & Sewage', icon: '🌊', title: 'Drainage' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          colors={[colors.secondary]}
        />
      }
    >
      {/* 1. Transparent Civic Mission Hero */}
      <View style={styles.heroSection}>
        <View style={styles.wardBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.wardBadgeText}>MUNICIPAL SERVICES ONLINE</Text>
        </View>
        <Text style={styles.heroTitle}>Report clearly.</Text>
        <Text style={styles.heroTitleAccent}>Resolve transparently.</Text>
        <Text style={styles.heroDesc}>
          Civic accountability engine connecting neighborhood infrastructure faults directly to verified municipal dispatch units.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 2. Primary Tactile Civic Action Card */}
      <View style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <Text style={styles.actionTag}>🛡️ VERIFIED CIVIC FILING</Text>
          <Text style={styles.actionHeading}>Encountered an infrastructure fault?</Text>
        </View>

        <TouchableOpacity
          style={styles.reportCtaBtn}
          onPress={() => onStartReport()}
          activeOpacity={0.9}
        >
          <Text style={styles.reportCtaText}>+ Report a Problem</Text>
        </TouchableOpacity>

        <Text style={styles.actionFooterText}>
          ⏱️ Takes ~2 minutes • Municipal triage within 4 hours
        </Text>
      </View>

      {/* 3. Active Grievances Live Banner */}
      <View style={styles.liveBanner}>
        <View style={styles.liveIconBox}>
          <Text style={{ fontSize: 20 }}>📋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.liveCountText}>
              {activeCount} Active {activeCount === 1 ? 'Grievance' : 'Grievances'}
            </Text>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>Active</Text>
            </View>
          </View>
          <Text style={styles.liveSubtext}>
            Municipal Service Standard Monitored
          </Text>
        </View>
        <TouchableOpacity onPress={onViewComplaints} style={styles.trackBtn}>
          <Text style={styles.trackLink}>Track →</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Quick Category Grid */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.catGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catCard}
              onPress={() => onStartReport(cat.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={styles.catTitle} numberOfLines={1}>
                {cat.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Recent Reports Ledger */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Grievances</Text>
          <TouchableOpacity onPress={onViewComplaints} style={styles.viewAllBtn}>
            <Text style={styles.viewAllLink}>View All ({complaints.length})</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No reports filed yet in this district.</Text>
          </View>
        ) : (
          recent.map((c) => {
            const tracking = c.tracking_id || c.tracking_number || c.id;
            const loc = c.location || c.address_text || 'Central Municipal District';
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.complaintCard}
                onPress={() => onSelectComplaint(c.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.trackingId}>{tracking}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {c.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.complaintDesc} numberOfLines={2}>
                  {c.description}
                </Text>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.locationText} numberOfLines={1}>
                    📍 {loc}
                  </Text>
                  <Text style={styles.dateText}>
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
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
    paddingBottom: 60,
  },
  heroSection: {
    marginBottom: spacing.md,
  },
  wardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceDim,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  wardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  retryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.error,
  },
  actionCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  actionHeader: {
    marginBottom: spacing.md,
  },
  actionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryContainer,
    marginBottom: 4,
  },
  actionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  reportCtaBtn: {
    backgroundColor: colors.secondary,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  reportCtaText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionFooterText: {
    color: '#b8c4ff',
    fontSize: 11,
    textAlign: 'center',
  },
  liveBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  liveIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCountText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  liveTag: {
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
  },
  liveSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  trackBtn: {
    padding: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  trackLink: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  catGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  catCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
  },
  catIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  catTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  viewAllBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
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
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  complaintCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTopRow: {
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
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  complaintDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  locationText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.sm,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
