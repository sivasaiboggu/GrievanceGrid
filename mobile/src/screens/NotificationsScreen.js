import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { mobileApi } from '../api';

export function NotificationsScreen({ onSelectComplaint }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifs = async () => {
    try {
      const data = await mobileApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await mobileApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifs();
            }}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>🔔</Text>
              <Text style={styles.emptyTitle}>No Unread Notices</Text>
              <Text style={styles.emptyDesc}>
                You will receive alerts when officers triage and dispatch crews to your grievances.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.itemCard, !item.is_read && styles.itemCardUnread]}
            onPress={() => {
              if (!item.is_read) handleMarkRead(item.id);
              if (item.entity_id && onSelectComplaint) {
                onSelectComplaint(item.entity_id);
              }
            }}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.itemMsg}>{item.message}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  itemCardUnread: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.secondaryContainer,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    flex: 1,
  },
  itemDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  itemMsg: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
