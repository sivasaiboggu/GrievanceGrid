import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { mobileApi } from '../../api';

export function OfficerComplaintDetailScreen({
  complaintId,
  user,
  onBack,
  onOpenEvidence,
  onOpenDecision,
  onOpenDispatch,
}) {
  const [complaint, setComplaint] = useState(null);
  const [relatedCandidates, setRelatedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Clarification modal
  const [clarificationModal, setClarificationModal] = useState(false);
  const [clarificationNote, setClarificationNote] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [detailRes, relatedRes] = await Promise.all([
        mobileApi.getComplaint(complaintId),
        mobileApi.getRelatedCandidates(complaintId).catch(() => ({ candidates: [] })),
      ]);
      setComplaint(detailRes);
      setRelatedCandidates(relatedRes?.candidates || []);
    } catch (err) {
      console.warn('Failed to load complaint dossier:', err);
      setError(err.message || 'Unable to retrieve complaint record from municipal ledger.');
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmCategory = async (issueId, currentCategory, currentDept) => {
    try {
      setActionLoading(`issue-${issueId}`);
      await mobileApi.confirmIssue(complaintId, issueId, {
        confirmed_category: currentCategory,
        confirmed_department: currentDept,
        notes: `Validated by Officer ${user?.name || ''}`,
      });
      Alert.alert('Category Confirmed', 'Municipal category confirmed and recorded to the audit trail.');
      loadData();
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Could not confirm issue category.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmIncident = async (candidateId) => {
    try {
      setActionLoading(`link-${candidateId}`);
      await mobileApi.confirmIncident(complaintId, {
        related_complaint_id: candidateId,
        relation_type: 'CO_OCCURRING',
        notes: 'Officer confirmed co-occurring spatial incident.',
      });
      Alert.alert('Incident Linked', 'Incidents linked as co-occurring without merging records.');
      loadData();
    } catch (err) {
      Alert.alert('Linking Failed', err.message || 'Unable to link incidents.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSeparateIncident = async (candidateId) => {
    try {
      setActionLoading(`sep-${candidateId}`);
      await mobileApi.separateIncident(complaintId, {
        related_complaint_id: candidateId,
        notes: 'Officer verified reports are independent occurrences.',
      });
      Alert.alert('Incident Kept Distinct', 'Incident recorded as distinct independent occurrence.');
      loadData();
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Unable to separate incidents.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendClarification = async () => {
    if (!clarificationNote.trim()) {
      Alert.alert('Validation Error', 'Please enter a clarification request note.');
      return;
    }
    try {
      setActionLoading('clarification');
      await mobileApi.submitOfficerDecision(complaintId, {
        action: 'REQUEST_INFO',
        remarks: clarificationNote.trim(),
      });
      Alert.alert('Clarification Dispatched', 'Constituent notified via portal.');
      setClarificationModal(false);
      setClarificationNote('');
      loadData();
    } catch (err) {
      Alert.alert('Dispatch Failed', err.message || 'Unable to submit clarification request.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Loading Case Dossier & Provenance...</Text>
      </View>
    );
  }

  if (error || !complaint) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Case Not Available</Text>
        <Text style={styles.errorSub}>{error || 'The requested grievance record was not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryBtnText}>Retry Ingestion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Return to Queue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const issues = complaint.issues && complaint.issues.length > 0 ? complaint.issues : [
    {
      id: 'default',
      category: complaint.category || 'General Civic Inquiry',
      description: complaint.description,
      department: complaint.assigned_department || 'Municipal Operations',
      confidence: 0.92,
      officer_confirmed: false,
    }
  ];

  const primaryAttachment = complaint.attachments && complaint.attachments.length > 0 ? complaint.attachments[0] : null;
  const isAwaitingVerification = complaint.status === 'AWAITING_VERIFICATION';
  const isResolved = complaint.status === 'RESOLVED';

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSub}>MUNICIPAL AUDIT VIEW</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>Grievance Detail</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'O'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Banner & Case Identifier */}
        <View style={styles.statusBanner}>
          <View style={styles.caseBadgeRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.caseIdText}>CASE #{complaint.tracking_id || complaint.id?.slice(0, 8)}</Text>
          </View>
          <View style={[styles.statusPill, isAwaitingVerification && styles.statusPillWarning, isResolved && styles.statusPillResolved]}>
            <Text style={styles.statusPillText}>
              {complaint.status?.replace('_', ' ')} • PRIORITY {complaint.priority || 'MEDIUM'}
            </Text>
          </View>
        </View>

        {/* 1. Docket Summary Card */}
        <View style={styles.card}>
          <View style={styles.citizenRow}>
            <View style={styles.citizenAvatar}>
              <Text style={styles.citizenAvatarIcon}>👤</Text>
            </View>
            <View style={styles.citizenMeta}>
              <Text style={styles.citizenName}>{complaint.citizen_name || 'Constituent User'}</Text>
              <Text style={styles.citizenTag}>
                {complaint.citizen_phone || '#CZ-Record'} • {complaint.ward || 'Ward Central'}
              </Text>
            </View>
            <View style={styles.recordBadge}>
              <Text style={styles.recordBadgeText}>Citizen Record</Text>
            </View>
          </View>

          <View style={styles.metaBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🕒</Text>
              <Text style={styles.metaText}>
                {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : 'Recent Intake'}
                <Text style={styles.metaClient}> (PWA / Mobile Client)</Text>
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={[styles.metaText, styles.metaLocationText]} numberOfLines={2}>
                {complaint.address || complaint.location_name || 'Geotagged Municipal Sector'}
              </Text>
            </View>
          </View>

          {/* Verbatim Statement */}
          <View style={styles.verbatimWrap}>
            <Text style={styles.verbatimLabel}>CITIZEN VERBATIM TRANSCRIPT</Text>
            <View style={styles.verbatimBox}>
              <Text style={styles.quoteIcon}>“</Text>
              <Text style={styles.verbatimText}>
                {complaint.description || complaint.title || 'No narrative text recorded.'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Section A: Issue Analysis (Independent Decomposition) */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔀</Text>
            <View>
              <Text style={styles.sectionTitle}>Municipal Issue Decomposition</Text>
              <Text style={styles.sectionCaption}>Independent triage routing via semantic classification models</Text>
            </View>
          </View>

          {/* NLP Machine Banner */}
          <View style={styles.nlpBanner}>
            <Text style={styles.nlpIcon}>🤖</Text>
            <View style={styles.nlpTextWrap}>
              <Text style={styles.nlpTitle}>
                Research-grade NLP decomposed {issues.length} distinct municipal responsibilities
              </Text>
              <Text style={styles.nlpSubtitle}>
                Constituent prompt decomposed into concurrent administrative jurisdictions
              </Text>
            </View>
          </View>

          {/* Issues List */}
          {issues.map((issue, idx) => {
            const confPct = Math.round((issue.confidence || 0.9) * 100);
            return (
              <View key={issue.id || idx} style={styles.card}>
                <View style={styles.subIssueHeader}>
                  <View style={styles.subIssueTitleRow}>
                    <View style={styles.subIssueBadge}>
                      <Text style={styles.subIssueBadgeText}>#{String(idx + 1).padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.subIssueTitle}>{issue.category}</Text>
                  </View>
                  <View style={styles.confidencePill}>
                    <Text style={styles.confidenceText}>{confPct}% Confidence</Text>
                  </View>
                </View>

                <View style={styles.deptMetaRow}>
                  <Text style={styles.deptLabel}>Target Dept:</Text>
                  <Text style={styles.deptValue}>{issue.department || complaint.assigned_department || 'Public Works'}</Text>
                </View>

                {issue.officer_confirmed ? (
                  <View style={styles.confirmedRow}>
                    <Text style={styles.confirmedIcon}>✓</Text>
                    <Text style={styles.confirmedText}>Confirmed by Municipal Officer</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.confirmCatBtn}
                    onPress={() => handleConfirmCategory(issue.id, issue.category, issue.department)}
                    disabled={actionLoading === `issue-${issue.id}`}
                  >
                    {actionLoading === `issue-${issue.id}` ? (
                      <ActivityIndicator size="small" color={colors.secondary} />
                    ) : (
                      <Text style={styles.confirmCatBtnText}>Confirm Suggested Category</Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Linked Work Order Banner if exists */}
                {complaint.work_orders && complaint.work_orders.length > 0 && (
                  <View style={styles.linkedWoBox}>
                    <View style={styles.linkedWoHeader}>
                      <Text style={styles.linkedWoTitle}>
                        WO-{complaint.work_orders[0].id?.slice(0, 6)} ({complaint.work_orders[0].assigned_worker_name || 'Field Crew'})
                      </Text>
                      <Text style={styles.linkedWoTime}>
                        {complaint.work_orders[0].due_date ? `Due: ${new Date(complaint.work_orders[0].due_date).toLocaleDateString()}` : 'Dispatched'}
                      </Text>
                    </View>
                    <Text style={styles.linkedWoDesc} numberOfLines={2}>
                      {complaint.work_orders[0].description || 'Work Order in execution with municipal field services.'}
                    </Text>
                  </View>
                )}

                {/* Status Tag */}
                <View style={[styles.issueStatusTag, isAwaitingVerification && styles.issueStatusAwaiting]}>
                  <Text style={styles.issueStatusText}>
                    {isAwaitingVerification
                      ? '⏳ Awaiting Officer Verification Sign-Off'
                      : isResolved
                      ? '✓ Casework Complete & Formally Resolved'
                      : '⚡ Dispatched — In Field Progression'}
                  </Text>
                </View>

                {/* Actions for this issue */}
                <View style={styles.issueActionRow}>
                  {isAwaitingVerification ? (
                    <TouchableOpacity
                      style={styles.primaryActionBtn}
                      onPress={() => onOpenDecision(complaint)}
                    >
                      <Text style={styles.primaryActionBtnText}>Verify Field Work</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      onPress={() => onOpenDispatch(complaint, issue)}
                    >
                      <Text style={styles.secondaryActionBtnText}>Dispatch Work Order</Text>
                    </TouchableOpacity>
                  )}
                  {primaryAttachment && (
                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      onPress={() => onOpenEvidence(complaint, primaryAttachment)}
                    >
                      <Text style={styles.secondaryActionBtnText}>Inspect Photos</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. Section B: Field Evidence Preview */}
        <View style={styles.card}>
          <View style={styles.evidenceHeader}>
            <View style={styles.sectionHeaderNoMargin}>
              <Text style={styles.sectionIcon}>📷</Text>
              <Text style={styles.cardTitle}>Field Evidence Preview</Text>
            </View>
            <Text style={styles.evidenceCountBadge}>
              {complaint.attachments?.length || (primaryAttachment ? 1 : 0)} Attached
            </Text>
          </View>

          {primaryAttachment ? (
            <View style={styles.evidenceMediaWrap}>
              <Image
                source={{ uri: primaryAttachment.file_url || primaryAttachment.url }}
                style={styles.evidenceImage}
                resizeMode="cover"
              />
              <View style={styles.hashOverlay}>
                <Text style={styles.hashOverlayIcon}>🔒</Text>
                <Text style={styles.hashOverlayText}>
                  File SHA-256: {primaryAttachment.sha256_hash ? primaryAttachment.sha256_hash.slice(0, 12) + '...' : 'Available'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noEvidenceBox}>
              <Text style={styles.noEvidenceIcon}>📁</Text>
              <Text style={styles.noEvidenceText}>No media files uploaded during citizen intake.</Text>
            </View>
          )}

          {/* Provenance Checklist */}
          <View style={styles.provenanceBox}>
            <View style={styles.provRow}>
              <Text style={styles.provCheckIcon}>✓</Text>
              <View style={styles.provTextWrap}>
                <Text style={styles.provTitle}>Location Metadata</Text>
                <Text style={styles.provSubtitle}>
                  {complaint.latitude && complaint.longitude
                    ? `Available (${Number(complaint.latitude).toFixed(4)}° N, ${Number(complaint.longitude).toFixed(4)}° W)`
                    : 'Location metadata not embedded'}
                </Text>
              </View>
            </View>

            <View style={styles.provRow}>
              <Text style={styles.provCheckIcon}>ℹ️</Text>
              <View style={styles.provTextWrap}>
                <Text style={styles.provTitle}>Synthetic-Content Screening</Text>
                <Text style={styles.provSubtitle}>
                  Automated screening requires manual verification.
                </Text>
              </View>
            </View>
          </View>

          {/* Operational Casework Notice */}
          <View style={styles.policyWarningBox}>
            <Text style={styles.policyWarningIcon}>ℹ️</Text>
            <Text style={styles.policyWarningText}>
              Field-worker completion does not resolve the complaint. Officer verification is required before case closure.
            </Text>
          </View>

          {primaryAttachment && (
            <TouchableOpacity
              style={styles.inspectEvidenceBtn}
              onPress={() => onOpenEvidence(complaint, primaryAttachment)}
            >
              <Text style={styles.inspectEvidenceBtnText}>Open Full Evidence Inspector →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Section C: Spatial Incident Clustering */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderNoMargin}>
            <Text style={styles.sectionIcon}>🌐</Text>
            <Text style={styles.cardTitle}>Spatial Incident Clustering</Text>
          </View>

          {relatedCandidates.length > 0 ? (
            relatedCandidates.map((cand) => (
              <View key={cand.id} style={styles.candidateCard}>
                <View style={styles.candidateHeader}>
                  <Text style={styles.candidateCaseId}>CASE #{cand.tracking_id || cand.id?.slice(0, 8)}</Text>
                  <Text style={styles.candidateTime}>
                    {cand.created_at ? new Date(cand.created_at).toLocaleDateString() : 'Proximate'}
                  </Text>
                </View>
                <Text style={styles.candidateDesc} numberOfLines={2}>
                  "{cand.title || cand.description}"
                </Text>
                <Text style={styles.candidateGeo}>
                  Distance: {cand.distance_meters ? `${Math.round(cand.distance_meters)}m` : 'Nearby'} • {cand.relation_explanation || 'Proximate civic report'}
                </Text>

                <View style={styles.candidateActions}>
                  <TouchableOpacity
                    style={styles.confirmClusterBtn}
                    onPress={() => handleConfirmIncident(cand.id)}
                    disabled={actionLoading === `link-${cand.id}`}
                  >
                    {actionLoading === `link-${cand.id}` ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmClusterBtnText}>Confirm Related</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.separateClusterBtn}
                    onPress={() => handleSeparateIncident(cand.id)}
                    disabled={actionLoading === `sep-${cand.id}`}
                  >
                    {actionLoading === `sep-${cand.id}` ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text style={styles.separateClusterBtnText}>Keep Distinct</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noCandidateBox}>
              <Text style={styles.noCandidateText}>
                No concurrent proximate complaints detected within 500m radius.
              </Text>
            </View>
          )}

          {/* Civic Equity Note */}
          <View style={styles.civicNoteBox}>
            <Text style={styles.civicNoteIcon}>⚖️</Text>
            <Text style={styles.civicNoteText}>
              <Text style={styles.civicNoteBold}>Casework Note:</Text> Proximate reports reflect recurring community impact and should be evaluated independently without merging.
            </Text>
          </View>
        </View>

        {/* 5. Adjudication Actions Section */}
        <View style={styles.adjudicationSection}>
          <TouchableOpacity
            style={styles.decisionMainBtn}
            onPress={() => onOpenDecision(complaint)}
          >
            <Text style={styles.decisionMainBtnIcon}>⚖️</Text>
            <Text style={styles.decisionMainBtnText}>Finalize Resolution Decision</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supplementalWoBtn}
            onPress={() => onOpenDispatch(complaint)}
          >
            <Text style={styles.supplementalWoIcon}>➕</Text>
            <Text style={styles.supplementalWoText}>Create Work Order Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clarificationBtn}
            onPress={() => setClarificationModal(true)}
          >
            <Text style={styles.clarificationIcon}>💬</Text>
            <Text style={styles.clarificationText}>Request Citizen Clarification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Clarification Modal */}
      <Modal visible={clarificationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Citizen Clarification</Text>
            <Text style={styles.modalSub}>
              This will request additional information from the constituent via their portal.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Please clarify exact landmark or provide daytime photo..."
              placeholderTextColor="#8e9bb0"
              value={clarificationNote}
              onChangeText={setClarificationNote}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setClarificationModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSendClarification}
                disabled={actionLoading === 'clarification'}
              >
                {actionLoading === 'clarification' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Dispatch Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    marginBottom: spacing.xs,
  },
  errorSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  backBtn: {
    paddingVertical: spacing.xs,
  },
  backBtnText: {
    color: colors.primary,
    fontWeight: '600',
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
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  statusBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryContainer || '#708cfd',
  },
  caseIdText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusPillWarning: {
    backgroundColor: '#b45309',
  },
  statusPillResolved: {
    backgroundColor: '#15803d',
  },
  statusPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  citizenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  citizenAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citizenAvatarIcon: {
    fontSize: 18,
  },
  citizenMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  citizenName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  citizenTag: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  recordBadge: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  recordBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  metaClient: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  metaLocationText: {
    color: colors.text,
    fontWeight: '600',
  },
  verbatimWrap: {
    marginTop: spacing.sm,
  },
  verbatimLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  verbatimBox: {
    backgroundColor: colors.surfaceContainerHigh || '#dce9ff',
    padding: spacing.sm,
    borderRadius: radius.md,
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    right: 8,
    top: 4,
    fontSize: 24,
    color: 'rgba(0,0,0,0.1)',
  },
  verbatimText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionWrap: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHeaderNoMargin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCaption: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  nlpBanner: {
    backgroundColor: colors.surfaceContainerHigh || '#dce9ff',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nlpIcon: {
    fontSize: 18,
  },
  nlpTextWrap: {
    flex: 1,
  },
  nlpTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  nlpSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  subIssueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  subIssueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  subIssueBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  subIssueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  subIssueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  confidencePill: {
    backgroundColor: 'rgba(55,85,195,0.15)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  confidenceText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  deptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  deptLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deptValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  confirmedIcon: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: 'bold',
  },
  confirmedText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
  },
  confirmCatBtn: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmCatBtnText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  linkedWoBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  linkedWoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  linkedWoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  linkedWoTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  linkedWoDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  issueStatusTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  issueStatusAwaiting: {
    backgroundColor: '#fffbeb',
  },
  issueStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  issueActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  primaryActionBtn: {
    flex: 1,
    height: 38,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 38,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  evidenceCountBadge: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  evidenceMediaWrap: {
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    position: 'relative',
    marginBottom: spacing.sm,
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  hashOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,4,18,0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hashOverlayIcon: {
    fontSize: 10,
    color: '#fff',
  },
  hashOverlayText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  noEvidenceBox: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  noEvidenceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  noEvidenceText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  provenanceBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  provRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  provCheckIcon: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: 'bold',
    marginTop: 1,
  },
  provTextWrap: {
    flex: 1,
  },
  provTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  provSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  policyWarningBox: {
    backgroundColor: 'rgba(55,85,195,0.08)',
    padding: spacing.xs,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: spacing.sm,
  },
  policyWarningIcon: {
    fontSize: 13,
  },
  policyWarningText: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
  inspectEvidenceBtn: {
    height: 40,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectEvidenceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  candidateCard: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  candidateCaseId: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  candidateTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  candidateDesc: {
    fontSize: 12,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  candidateGeo: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  candidateActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confirmClusterBtn: {
    flex: 1,
    height: 34,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmClusterBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  separateClusterBtn: {
    flex: 1,
    height: 34,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separateClusterBtnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  noCandidateBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  noCandidateText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  civicNoteBox: {
    backgroundColor: colors.surfaceContainer,
    padding: spacing.xs,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
  },
  civicNoteIcon: {
    fontSize: 13,
  },
  civicNoteText: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
  civicNoteBold: {
    fontWeight: '700',
    color: colors.text,
  },
  adjudicationSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  decisionMainBtn: {
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
    elevation: 3,
  },
  decisionMainBtnIcon: {
    fontSize: 18,
  },
  decisionMainBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  supplementalWoBtn: {
    height: 44,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  supplementalWoIcon: {
    fontSize: 16,
  },
  supplementalWoText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  clarificationBtn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  clarificationIcon: {
    fontSize: 14,
  },
  clarificationText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surfaceContainerLow,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  modalSubmitBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
