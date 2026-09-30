import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { mobileApi, getApiBaseUrl } from '../api';

export function ComplaintDetailScreen({ complaintId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');

  // Modals state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadDetail = async () => {
    try {
      const response = await mobileApi.getComplaint(complaintId);
      setData(response);
    } catch (err) {
      console.warn('Error loading complaint detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getApiBaseUrl().then((url) => setBaseUrl(url));
    loadDetail();
  }, [complaintId]);

  const handleSubmitFeedback = async () => {
    setSubmittingAction(true);
    try {
      await mobileApi.submitFeedback(complaintId, { rating, comments: feedbackComment.trim() });
      Alert.alert('Feedback Recorded', 'Thank you for rating the municipal remediation quality.');
      setFeedbackOpen(false);
      setFeedbackComment('');
      loadDetail();
    } catch (err) {
      Alert.alert('Feedback Error', err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      Alert.alert('Required', 'Please explain what remains unresolved or requires administrative reconsideration.');
      return;
    }
    setSubmittingAction(true);
    try {
      await mobileApi.submitAppeal(complaintId, { reason: appealReason.trim() });
      Alert.alert('Appeal Lodged', 'Your appeal has been submitted to the Appeal / Reconsideration Authority.');
      setAppealOpen(false);
      setAppealReason('');
      loadDetail();
    } catch (err) {
      Alert.alert('Appeal Error', err.message || 'Failed to submit appeal.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Complaint docket not found.</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 14, padding: 10 }}>
          <Text style={{ color: colors.secondary, fontWeight: 'bold' }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Normalize backend response: data may be { complaint: {...}, issues: [...], attachments: [...] } or direct complaint
  const complaint = data.complaint || data;
  const issues = data.issues || complaint.issues || [
    { category: complaint.category, description: complaint.description, status: complaint.status },
  ];
  const attachments = data.attachments || complaint.attachments || [];
  const history = data.history || complaint.history || [];
  const workOrders = data.workOrders || data.work_orders || complaint.workOrders || [];
  const appeals = data.appeals || complaint.appeals || [];

  const getStatusColor = (st) => {
    switch (st) {
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

  const statusStyle = getStatusColor(complaint.status);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Back Navigation Row */}
        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Text style={styles.backText}>← Back to Submissions</Text>
        </TouchableOpacity>

        {/* Case Meta Card */}
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.trackingId}>
              {complaint.tracking_id || complaint.tracking_number || complaint.id}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                {complaint.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{complaint.title || complaint.category}</Text>
          <Text style={styles.location}>
            📍 {complaint.location || complaint.address_text || 'Central Municipal District'}
          </Text>
          <Text style={styles.date}>
            Filed {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : 'Recently'}
          </Text>

          <View style={styles.intakeBox}>
            <Text style={styles.intakeLabel}>ORIGINAL CITIZEN INTAKE</Text>
            <Text style={styles.intakeText}>"{complaint.description}"</Text>
          </View>
        </View>

        {/* Multi-Issue Decomposition */}
        <Text style={styles.sectionTitle}>
          Issue Decomposition ({issues.length} {issues.length === 1 ? 'Branch' : 'Branches'})
        </Text>

        {issues.map((iss, idx) => {
          // Find matching work order for this issue if available
          const matchingWo = workOrders.find((w) => w.issue_id === iss.id);
          return (
            <View key={iss.id || idx} style={styles.issueCard}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueBranch}>BRANCH #0{idx + 1}</Text>
                <View style={styles.issueStatusTag}>
                  <Text style={styles.issueStatusText}>{iss.status || 'EVALUATED'}</Text>
                </View>
              </View>
              <Text style={styles.issueCategory}>{iss.category}</Text>
              <Text style={styles.issueDesc}>{iss.description}</Text>

              <View style={styles.woInfo}>
                <Text style={styles.woText}>
                  {matchingWo
                    ? `Work Order: #${matchingWo.id} • Status: ${matchingWo.status} • Dept: ${matchingWo.department_id}`
                    : 'Work Order: Pending assignment by triage officer'}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Evidence Attachments Section */}
        {attachments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>
              Verified Evidence Attachments ({attachments.length})
            </Text>
            {attachments.map((att, idx) => {
              const fullFileUrl = att.file_url?.startsWith('http')
                ? att.file_url
                : `${baseUrl.replace('/api', '')}${att.file_url}`;
              return (
                <View key={att.id || idx} style={styles.attachmentRow}>
                  <View style={styles.attIconBox}>
                    <Text style={{ fontSize: 20 }}>📷</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.attFileName} numberOfLines={1}>
                      {att.file_name || `Evidence #${idx + 1}`}
                    </Text>
                    <Text style={styles.attHash} numberOfLines={1}>
                      SHA-256: {att.sha256_hash ? att.sha256_hash.slice(0, 16) + '...' : 'Recorded'}
                    </Text>
                  </View>
                  <View style={styles.attTag}>
                    <Text style={styles.attTagText}>EXIF Recorded</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Timeline & Status History */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Timeline & Status History</Text>
          {history.length === 0 ? (
            <View style={styles.trailItem}>
              <Text style={styles.trailDot}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.trailTitle}>Citizen Grievance Registered</Text>
                <Text style={styles.trailDesc}>Grievance docket created with geolocation</Text>
              </View>
            </View>
          ) : (
            history.map((h, idx) => (
              <View key={h.id || idx} style={styles.trailItem}>
                <Text style={styles.trailDot}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trailTitle}>
                    Status: {h.new_status ? h.new_status.replace(/_/g, ' ') : 'Updated'}
                  </Text>
                  <Text style={styles.trailDesc}>
                    {h.notes || 'Status updated in municipal docket'}
                  </Text>
                  {h.created_at && (
                    <Text style={styles.trailTime}>
                      {new Date(h.created_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Existing Appeals Section if filed */}
        {appeals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Appeals Filed ({appeals.length})</Text>
            {appeals.map((app, idx) => (
              <View key={app.id || idx} style={styles.appealRecord}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.appealIdText}>Appeal #{app.id}</Text>
                  <Text style={styles.appealStatusText}>{app.status || 'PENDING'}</Text>
                </View>
                <Text style={styles.appealReasonText}>"{app.reason}"</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.feedbackBtn}
            onPress={() => setFeedbackOpen(true)}
          >
            <Text style={styles.feedbackBtnText}>⭐ Provide Citizen Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appealBtn}
            onPress={() => setAppealOpen(true)}
          >
            <Text style={styles.appealBtnText}>⚖️ Request Reconsideration / Appeal</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Dialog */}
        {feedbackOpen && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Rate Remediation Quality</Text>
              <Text style={styles.modalDesc}>How satisfied are you with the municipal response?</Text>

              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 32, marginHorizontal: 2, color: rating >= s ? '#F59E0B' : '#D1D5DB' }}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Comments or feedback for the engineering team..."
                value={feedbackComment}
                onChangeText={setFeedbackComment}
                multiline
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setFeedbackOpen(false)}
                  disabled={submittingAction}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmit}
                  onPress={handleSubmitFeedback}
                  disabled={submittingAction}
                >
                  {submittingAction ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Submit Rating</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Appeal Dialog */}
        {appealOpen && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Administrative Appeal</Text>
              <Text style={styles.modalDesc}>
                Explain why the remediation is incomplete or requires review by the Appeal Authority.
              </Text>

              <TextInput
                style={[styles.modalInput, { minHeight: 90 }]}
                placeholder="State why the work was incomplete or inadequate..."
                value={appealReason}
                onChangeText={setAppealReason}
                multiline
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setAppealOpen(false)}
                  disabled={submittingAction}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmit}
                  onPress={handleSubmitAppeal}
                  disabled={submittingAction}
                >
                  {submittingAction ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Submit Appeal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backRow: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  trackingId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  intakeBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  intakeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  intakeText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  issueCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueBranch: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  issueStatusTag: {
    backgroundColor: colors.surfaceDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  issueStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  issueCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  issueDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  woInfo: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  woText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  attIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attFileName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  attHash: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  attTag: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  attTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
  },
  trailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trailDot: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
    marginTop: 1,
  },
  trailTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  trailDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  trailTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  appealRecord: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  appealIdText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  appealStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  appealReasonText: {
    fontSize: 12,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  feedbackBtn: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBtnText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  appealBtn: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appealBtnText: {
    color: colors.primaryContainer,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 4, 18, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: spacing.md,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  modalCancel: {
    height: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmit: {
    height: 44,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
