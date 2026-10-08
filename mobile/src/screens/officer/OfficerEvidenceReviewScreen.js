import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Clipboard,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';

export function OfficerEvidenceReviewScreen({
  complaint,
  attachment,
  onBack,
}) {
  const [zoomed, setZoomed] = useState(false);
  const [adjudicationStatus, setAdjudicationStatus] = useState(null);

  const hashString = attachment?.sha256_hash || '4b92f01eaa1891c0b8f4109ca981249e';
  const displayHash = `${hashString.slice(0, 4)}-${hashString.slice(4, 8)}-${hashString.slice(8, 12)}-${hashString.slice(12, 16)}`;
  const imageUrl = attachment?.file_url || attachment?.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80';

  const copyToClipboard = () => {
    Clipboard.setString(hashString);
    Alert.alert('Hash Copied', 'File SHA-256 cryptographic hash copied to clipboard.');
  };

  const handleRecordDecision = (type) => {
    if (type === 'approve') {
      setAdjudicationStatus('ACCEPTED');
      Alert.alert(
        'Evidence Accepted',
        'Artifact confirmed acceptable for officer casework verification.',
        [{ text: 'Return to Dossier', onPress: onBack }]
      );
    } else if (type === 'inspect') {
      setAdjudicationStatus('FLAGGED_INSPECTION');
      Alert.alert(
        'Flagged for Field Verification',
        'Case flagged for on-ground physical inspection by field crew.',
        [{ text: 'OK' }]
      );
    } else {
      setAdjudicationStatus('CLARIFICATION');
      Alert.alert(
        'Clarification Requested',
        'Constituent asked to provide daylight or wide-angle clarification photo.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSub}>OFFICER CASEWORK VIEW</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>Field Evidence Review</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>O</Text>
          </View>
        </View>
      </View>

      {/* Tracker Strip */}
      <View style={styles.trackerStrip}>
        <View style={styles.trackerLeft}>
          <View style={styles.trackerDot} />
          <Text style={styles.trackerCaseText}>CASE #{complaint?.tracking_id || complaint?.id?.slice(0, 8)}</Text>
        </View>
        <View style={styles.trackerRight}>
          <Text style={styles.trackerItemText}>ITEM 1 OF 1</Text>
          <Text style={styles.trackerIcon}>📷</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Evidence Media Viewer */}
        <View style={styles.viewerContainer}>
          <View style={[styles.imageWrap, zoomed && styles.imageWrapZoomed]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode={zoomed ? 'contain' : 'cover'}
            />

            {/* Top Status Overlays */}
            <View style={styles.topOverlayRow}>
              <View style={styles.shaChip}>
                <Text style={styles.shaChipIcon}>🔒</Text>
                <Text style={styles.shaChipText}>FILE SHA-256</Text>
              </View>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoomed(!zoomed)}
              >
                <Text style={styles.zoomBtnIcon}>{zoomed ? '⊖' : '⊕'}</Text>
              </TouchableOpacity>
            </View>

            {/* Lower Metadata Chips Floating */}
            <View style={styles.lowerOverlayRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipIcon}>📍</Text>
                <Text style={styles.metaChipText}>LOCATION: RECORDED</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipIcon}>📋</Text>
                <Text style={styles.metaChipText}>METADATA: AVAILABLE</Text>
              </View>
            </View>
          </View>

          {/* Hex Hash Footer */}
          <View style={styles.hashFooter}>
            <Text style={styles.hashFooterText} numberOfLines={1}>
              File SHA-256: {displayHash}
            </Text>
            <TouchableOpacity style={styles.copyHashBtn} onPress={copyToClipboard}>
              <Text style={styles.copyHashIcon}>📋</Text>
              <Text style={styles.copyHashText}>Copy Hash</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Automated Screening Status */}
        <View style={styles.card}>
          <View style={styles.diagHeader}>
            <View>
              <Text style={styles.diagSub}>Automated Screening Status</Text>
              <Text style={styles.cardTitle}>Image Integrity & Metadata Review</Text>
            </View>
            <View style={styles.nominalBadge}>
              <View style={styles.nominalDot} />
              <Text style={styles.nominalText}>REVIEW REQUIRED</Text>
            </View>
          </View>

          {/* Synthetic Risk Evaluation */}
          <View style={styles.syntheticBox}>
            <View style={styles.syntheticTitleRow}>
              <View style={styles.syntheticLabelWrap}>
                <Text style={styles.syntheticIcon}>📊</Text>
                <Text style={styles.syntheticLabel}>Synthetic Content Risk</Text>
              </View>
              <Text style={styles.syntheticValue}>REQUIRES MANUAL REVIEW</Text>
            </View>
            <Text style={styles.syntheticDesc}>
              Automated synthetic-content screening is experimental. Automated screening requires officer manual verification before any casework decision.
            </Text>
          </View>

          {/* Metadata Provenance Grid */}
          <View style={styles.provenanceWrap}>
            <Text style={styles.provenanceSectionLabel}>INGESTION & CAPTURE METADATA</Text>
            <View style={styles.provenanceGrid}>
              <View style={styles.provenanceItem}>
                <Text style={styles.provItemKey}>📱 Device Metadata</Text>
                <Text style={styles.provItemVal}>Available</Text>
              </View>
              <View style={styles.provenanceItem}>
                <Text style={styles.provItemKey}>🕒 Ingestion Time</Text>
                <Text style={styles.provItemVal}>
                  {complaint?.created_at ? new Date(complaint.created_at).toLocaleString() : 'Recent Submission'}
                </Text>
              </View>
              <View style={styles.provenanceItem}>
                <Text style={styles.provItemKey}>📍 Location Metadata</Text>
                <Text style={styles.provItemVal}>
                  {complaint?.latitude ? `${Number(complaint.latitude).toFixed(4)}° N, ${Number(complaint.longitude).toFixed(4)}° W` : 'Available'}
                </Text>
              </View>
              <View style={styles.provenanceItem}>
                <Text style={styles.provItemKey}>🏢 Location Reference</Text>
                <Text style={[styles.provItemVal, styles.provValTruncate]} numberOfLines={1}>
                  {complaint?.address || 'Municipal Ward Area'}
                </Text>
              </View>
            </View>
          </View>

          {/* Civic Policy Guardrail Reminder */}
          <View style={styles.civicPolicyBox}>
            <Text style={styles.civicPolicyIcon}>⚖️</Text>
            <View style={styles.civicPolicyTextWrap}>
              <Text style={styles.civicPolicyTitle}>Operational Casework Policy</Text>
              <Text style={styles.civicPolicySub}>
                Automated checks provide screening assistance only. Officer manual review is required for all consequential casework determinations.
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Context & Reference Datasets */}
        <View style={styles.card}>
          <View style={styles.corpusHeader}>
            <View style={styles.corpusTitleWrap}>
              <Text style={styles.corpusIcon}>🗄️</Text>
              <Text style={styles.cardTitle}>Civic Image Reference</Text>
            </View>
            <View style={styles.corpusTag}>
              <Text style={styles.corpusTagText}>RDD2022 + TACO</Text>
            </View>
          </View>

          <Text style={styles.corpusDesc}>
            Civic infrastructure reference corpora (RDD2022 and TACO) are utilized for civic category classification. Officer visual inspection confirms the reported condition.
          </Text>

          <View style={styles.novelCaptureBox}>
            <View style={styles.novelLeft}>
              <Text style={styles.novelIcon}>🔍</Text>
              <Text style={styles.novelText}>Verification Status</Text>
            </View>
            <Text style={styles.novelValue}>PENDING OFFICER REVIEW</Text>
          </View>
        </View>

        {/* 4. Officer Adjudication Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.controlsHeader}>OFFICER VERIFICATION DETERMINATION</Text>
          <Text style={styles.controlsSub}>
            Record your evidence review determination into the case audit trail.
          </Text>

          {adjudicationStatus && (
            <View style={styles.adjudicationStatusBanner}>
              <Text style={styles.adjudicationStatusText}>
                Status: {adjudicationStatus} (Recorded to Casework Audit Trail)
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleRecordDecision('approve')}
          >
            <Text style={styles.approveBtnIcon}>✓</Text>
            <Text style={styles.approveBtnText}>Accept Evidence for Casework</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => handleRecordDecision('inspect')}
          >
            <Text style={styles.inspectBtnIcon}>🔍</Text>
            <Text style={styles.inspectBtnText}>Flag for Field Inspection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clarifyEvidenceBtn}
            onPress={() => handleRecordDecision('clarify')}
          >
            <Text style={styles.clarifyEvidenceIcon}>💬</Text>
            <Text style={styles.clarifyEvidenceText}>Request Citizen Photo Clarification</Text>
          </TouchableOpacity>
        </View>
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
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackIcon: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  headerSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  trackerStrip: {
    backgroundColor: colors.surfaceContainerHigh || '#dce9ff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trackerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  trackerCaseText: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
  },
  trackerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  trackerItemText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  trackerIcon: {
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  viewerContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  imageWrap: {
    width: '100%',
    height: 240,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1a202c',
    position: 'relative',
  },
  imageWrapZoomed: {
    height: 340,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topOverlayRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,4,18,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  shaChipIcon: {
    fontSize: 11,
    color: '#fff',
  },
  shaChipText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,4,18,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  lowerOverlayRow: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  metaChipIcon: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
  },
  hashFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: spacing.xs,
  },
  hashFooterText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyHashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  copyHashIcon: {
    fontSize: 12,
  },
  copyHashText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  diagHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  diagSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nominalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  nominalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803d',
  },
  nominalText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#15803d',
  },
  syntheticBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  syntheticTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  syntheticLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syntheticIcon: {
    fontSize: 14,
  },
  syntheticLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  syntheticValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    fontFamily: 'monospace',
  },
  syntheticDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  provenanceWrap: {
    marginBottom: spacing.sm,
  },
  provenanceSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  provenanceGrid: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  provenanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  provItemKey: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  provItemVal: {
    fontSize: 11,
    color: colors.text,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  provValTruncate: {
    maxWidth: 160,
  },
  civicPolicyBox: {
    backgroundColor: colors.surfaceContainerHigh || '#dce9ff',
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  civicPolicyIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  civicPolicyTextWrap: {
    flex: 1,
  },
  civicPolicyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  civicPolicySub: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
  },
  corpusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  corpusTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  corpusIcon: {
    fontSize: 16,
  },
  corpusTag: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  corpusTagText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  corpusDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  novelCaptureBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  novelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  novelIcon: {
    fontSize: 14,
  },
  novelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  novelValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    fontFamily: 'monospace',
  },
  controlsSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  controlsHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  controlsSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  adjudicationStatusBanner: {
    backgroundColor: '#dcfce7',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  adjudicationStatusText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  approveBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  inspectBtn: {
    height: 44,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  inspectBtnIcon: {
    fontSize: 14,
  },
  inspectBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  clarifyEvidenceBtn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  clarifyEvidenceIcon: {
    fontSize: 14,
  },
  clarifyEvidenceText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
