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

export function OfficerNotificationsTab({ onSelectComplaint }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await mobileApi.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleMarkRead = async (id) => {
    try {
      await mobileApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Officer Operational Notices</Text>
        <Text style={styles.headerSubtitle}>
          Audit telemetry, citizen appeals & crew sign-offs
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifs();
            }}
            colors={[colors.secondary]}
          />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All Caught Up</Text>
            <Text style={styles.emptyDesc}>
              No pending precinct notices or audit alerts at this time.
            </Text>
          </View>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, !n.is_read && styles.notifCardUnread]}
              activeOpacity={0.8}
              onPress={() => {
                if (!n.is_read) handleMarkRead(n.id);
                if (n.entity_id && onSelectComplaint) {
                  onSelectComplaint(n.entity_id);
                }
              }}
            >
              <View style={styles.notifLeft}>
                <View
                  style={[
                    styles.notifIconBadge,
                    n.type?.includes('APPEAL')
                      ? { backgroundColor: colors.errorBg }
                      : n.type?.includes('COMPLETED')
                      ? { backgroundColor: colors.secondaryFixed }
                      : { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>
                    {n.type?.includes('APPEAL')
                      ? '⚠️'
                      : n.type?.includes('COMPLETED')
                      ? '🛡️'
                      : '📬'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifTitleRow}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    {!n.is_read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.notifMessage}>{n.message}</Text>
                  <Text style={styles.notifTime}>
                    {n.created_at ? n.created_at.slice(0, 16).replace('T', ' ') : 'Just now'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
    marginTop: 2,
  },
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifCardUnread: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  notifLeft: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notifIconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.secondary,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
});
