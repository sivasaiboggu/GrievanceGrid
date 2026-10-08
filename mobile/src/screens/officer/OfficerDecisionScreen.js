import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { mobileApi } from '../../api';

export function OfficerDecisionScreen({
  complaint,
  workOrder,
  user,
  onBack,
  onDecisionComplete,
}) {
  const [responseCoverage, setResponseCoverage] = useState('ADDRESSED'); // ADDRESSED | PARTIAL | NOT_ADDRESSED | UNCLEAR
  const [resolutionAction, setResolutionAction] = useState('RESOLVE'); // RESOLVE | REQUIRE_ACTION | REQUEST_INFO
  const [caseworkNotes, setCaseworkNotes] = useState(
    'Field remediation inspected and verified. Equipment installed to technical standards. Electrical safety and grounding confirmed.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [sealed, setSealed] = useState(false);

  const activeWo = workOrder || (complaint?.work_orders && complaint.work_orders[0]) || {
    id: 'WO-8821',
    assigned_worker_name: 'Crew 04 (Vasquez)',
    department_name: complaint?.assigned_department || 'Municipal Operations',
    due_date: '2026-05-15',
    completion_notes: 'Field crew completed luminaire fixture and wiring replacement. Tested electrical safety and ground.',
    completion_photos: ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80'],
  };

  const citizenPhoto = complaint?.attachments && complaint.attachments.length > 0
    ? (complaint.attachments[0].file_url || complaint.attachments[0].url)
    : 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80';

  const crewPhoto = (activeWo.completion_photos && activeWo.completion_photos.length > 0)
    ? activeWo.completion_photos[0]
    : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80';

  const handleFinalizeDecision = async () => {
    if (!caseworkNotes.trim()) {
      Alert.alert('Validation Error', 'Please enter officer casework findings and digest.');
      return;
    }

    try {
      setSubmitting(true);
      await mobileApi.submitOfficerDecision(complaint.id, {
        action: resolutionAction,
        remarks: caseworkNotes.trim(),
        response_coverage: responseCoverage,
      });

      setSealed(true);
      setTimeout(() => {
        Alert.alert(
          'Decision Recorded',
          resolutionAction === 'RESOLVE'
            ? 'Officer casework resolution recorded and citizen notification updated.'
            : 'Directive recorded and case status updated.',
          [{ text: 'Return to Dossier', onPress: () => {
            if (onDecisionComplete) onDecisionComplete();
            else onBack();
          }}]
        );
      }, 600);
    } catch (err) {
      Alert.alert('Decision Failed', err.message || 'Unable to record casework decision.');
      setSubmitting(false);
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
          <Text style={styles.headerTitle} numberOfLines={1}>Response Verification & Decision</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'O'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Case & Work Order Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.accentBorder} />
          <View style={styles.woHeaderTop}>
            <View style={styles.woTitles}>
              <Text style={styles.woCaseId}>CASE #{complaint?.tracking_id || complaint?.id?.slice(0, 8)}</Text>
              <Text style={styles.woNumber}>Work Order #{activeWo.id?.slice(0, 8) || 'WO-Pending'}</Text>
            </View>
            <View style={styles.woAwaitingPill}>
              <Text style={styles.woAwaitingIcon}>✓</Text>
              <Text style={styles.woAwaitingText}>Awaiting Officer Verification</Text>
            </View>
          </View>

          <View style={styles.woGrid}>
            <View style={styles.woGridCol}>
              <Text style={styles.woGridKey}>ASSIGNED DEPARTMENT</Text>
              <Text style={styles.woGridVal} numberOfLines={1}>{activeWo.department_name || 'Operations'}</Text>
            </View>
            <View style={styles.woGridCol}>
              <Text style={styles.woGridKey}>ASSIGNED WORKER</Text>
              <Text style={styles.woGridVal} numberOfLines={1}>{activeWo.assigned_worker_name || 'Field Specialist'}</Text>
            </View>
            <View style={[styles.woGridCol, styles.woGridColFull]}>
              <Text style={styles.woGridKey}>SUBMISSION TIMESTAMP</Text>
              <Text style={styles.woGridValCode}>
                {complaint?.updated_at ? new Date(complaint.updated_at).toLocaleString() : 'Recent Submission'}
              </Text>
            </View>
          </View>

          {/* Operational Rule Callout */}
          <View style={styles.statutoryRuleBox}>
            <Text style={styles.statutoryIcon}>ℹ️</Text>
            <Text style={styles.statutoryText}>
              <Text style={styles.statutoryBold}>Operational Casework Rule:</Text> Field-worker completion does not resolve the complaint. Officer verification is required before resolution.
            </Text>
          </View>
        </View>

        {/* Physical Verification Chain */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Physical Verification Comparison</Text>
            <Text style={styles.sectionSubtitle}>Intake vs. Response Evidence</Text>
          </View>

          {/* Citizen Intake (Before) */}
          <View style={styles.evidenceCompareCard}>
            <View style={styles.compareHeader}>
              <View style={styles.compareTitleWrap}>
                <Text style={styles.hazardIcon}>⚠️</Text>
                <Text style={styles.compareTitle}>INTAKE EVIDENCE (CITIZEN)</Text>
              </View>
              <Text style={styles.compareTime}>
                {complaint?.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Intake'}
              </Text>
            </View>
            <View style={styles.compareImageWrap}>
              <Image
                source={{ uri: citizenPhoto }}
                style={styles.compareImage}
                resizeMode="cover"
              />
              <View style={styles.geoTagOverlay}>
                <Text style={styles.geoTagText}>
                  📍 {complaint?.latitude ? `${Number(complaint.latitude).toFixed(4)}° N, ${Number(complaint.longitude).toFixed(4)}° W` : 'Location Recorded'}
                </Text>
              </View>
            </View>
            <View style={styles.compareFooter}>
              <Text style={styles.compareDesc} numberOfLines={2}>
                Reported: {complaint?.description || 'Municipal physical hazard reported at location.'}
              </Text>
              <View style={styles.loggedBadge}>
                <Text style={styles.loggedBadgeText}>INGESTED</Text>
              </View>
            </View>
          </View>

          {/* Crew Field Response Evidence (After) */}
          <View style={styles.evidenceCompareCard}>
            <View style={styles.compareHeader}>
              <View style={styles.compareTitleWrap}>
                <Text style={styles.checkDoneIcon}>✓</Text>
                <Text style={styles.compareTitle}>FIELD RESPONSE ({activeWo.assigned_worker_name || 'CREW'})</Text>
              </View>
              <Text style={styles.compareTime}>Completion</Text>
            </View>
            <View style={styles.compareImageWrap}>
              <Image
                source={{ uri: crewPhoto }}
                style={styles.compareImage}
                resizeMode="cover"
              />
              <View style={styles.exifVerifiedOverlay}>
                <Text style={styles.exifVerifiedText}>FIELD COMPLETION PHOTO</Text>
              </View>
              <View style={styles.geoTagOverlay}>
                <Text style={styles.geoTagText}>📍 Location Metadata: Recorded</Text>
              </View>
            </View>
            <View style={styles.compareFooter}>
              <View style={styles.crewNoteWrap}>
                <Text style={styles.crewNoteTitle}>
                  {activeWo.completion_notes || 'Remediation completed. Equipment operational and secured.'}
                </Text>
                <Text style={styles.crewNoteHash}>File SHA-256 Available</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Response Coverage Determination */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Response Coverage Determination</Text>
          <Text style={styles.cardSub}>Assess how comprehensively the recorded field action addresses the citizen grievance.</Text>

          <View style={styles.radioList}>
            {/* Option 1: ADDRESSED */}
            <TouchableOpacity
              style={[styles.radioItem, responseCoverage === 'ADDRESSED' && styles.radioItemSelected]}
              onPress={() => setResponseCoverage('ADDRESSED')}
            >
              <View style={[styles.radioCircle, responseCoverage === 'ADDRESSED' && styles.radioCircleActive]}>
                {responseCoverage === 'ADDRESSED' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <View style={styles.radioLabelRow}>
                  <Text style={styles.radioLabel}>Addressed</Text>
                  <View style={styles.radioTag}>
                    <Text style={styles.radioTagText}>FULL REMEDIATION</Text>
                  </View>
                </View>
                <Text style={styles.radioDesc}>Physical hazard fully remediated according to operational standards.</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: PARTIAL */}
            <TouchableOpacity
              style={[styles.radioItem, responseCoverage === 'PARTIAL' && styles.radioItemSelected]}
              onPress={() => setResponseCoverage('PARTIAL')}
            >
              <View style={[styles.radioCircle, responseCoverage === 'PARTIAL' && styles.radioCircleActive]}>
                {responseCoverage === 'PARTIAL' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>Partial</Text>
                <Text style={styles.radioDesc}>Portion of work accomplished; residual remediation needed.</Text>
              </View>
            </TouchableOpacity>

            {/* Option 3: NOT_ADDRESSED */}
            <TouchableOpacity
              style={[styles.radioItem, responseCoverage === 'NOT_ADDRESSED' && styles.radioItemSelected]}
              onPress={() => setResponseCoverage('NOT_ADDRESSED')}
            >
              <View style={[styles.radioCircle, responseCoverage === 'NOT_ADDRESSED' && styles.radioCircleActive]}>
                {responseCoverage === 'NOT_ADDRESSED' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>Not Addressed</Text>
                <Text style={styles.radioDesc}>Field visit concluded without resolving the reported issue.</Text>
              </View>
            </TouchableOpacity>

            {/* Option 4: UNCLEAR */}
            <TouchableOpacity
              style={[styles.radioItem, responseCoverage === 'UNCLEAR' && styles.radioItemSelected]}
              onPress={() => setResponseCoverage('UNCLEAR')}
            >
              <View style={[styles.radioCircle, responseCoverage === 'UNCLEAR' && styles.radioCircleActive]}>
                {responseCoverage === 'UNCLEAR' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>Unclear</Text>
                <Text style={styles.radioDesc}>Response evidence is insufficient, ambiguous, or lacks confidence.</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Casework Note */}
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceIcon}>ℹ️</Text>
            <Text style={styles.guidanceText}>
              <Text style={styles.guidanceBold}>Casework Note:</Text> Missing evidence is not automatically "Not Addressed". Overdue is a workflow timer, not a response coverage rating.
            </Text>
          </View>
        </View>

        {/* Officer Resolution Action */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Officer Resolution Action</Text>
          <Text style={styles.cardSub}>Establish casework record and issue citizen outcome notification.</Text>

          <View style={styles.radioList}>
            {/* Option 1: Resolve Complaint */}
            <TouchableOpacity
              style={[styles.radioItem, resolutionAction === 'RESOLVE' && styles.radioItemSelected]}
              onPress={() => setResolutionAction('RESOLVE')}
            >
              <View style={[styles.radioCircle, resolutionAction === 'RESOLVE' && styles.radioCircleActive]}>
                {resolutionAction === 'RESOLVE' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>Resolve Complaint</Text>
                <Text style={styles.radioDesc}>Issues resolution notice to citizen portal and closes complaint lifecycle.</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Require Further Action */}
            <TouchableOpacity
              style={[styles.radioItem, resolutionAction === 'REQUIRE_ACTION' && styles.radioItemSelected]}
              onPress={() => setResolutionAction('REQUIRE_ACTION')}
            >
              <View style={[styles.radioCircle, resolutionAction === 'REQUIRE_ACTION' && styles.radioCircleActive]}>
                {resolutionAction === 'REQUIRE_ACTION' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>Require Further Action</Text>
                <Text style={styles.radioDesc}>Return work order to crew with specific field remediation directives.</Text>
              </View>
            </TouchableOpacity>

            {/* Option 3: Awaiting Supplemental Evidence */}
            <TouchableOpacity
              style={[styles.radioItem, resolutionAction === 'REQUEST_INFO' && styles.radioItemSelected]}
              onPress={() => setResolutionAction('REQUEST_INFO')}
            >
              <View style={[styles.radioCircle, resolutionAction === 'REQUEST_INFO' && styles.radioCircleActive]}>
                {resolutionAction === 'REQUEST_INFO' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>Awaiting Supplemental Evidence</Text>
                <Text style={styles.radioDesc}>Request supplementary dispatch telemetry or photo clarification.</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Casework Findings Input */}
          <View style={styles.notesWrap}>
            <View style={styles.notesHeader}>
              <Text style={styles.notesLabel}>OFFICER CASEWORK FINDINGS</Text>
              <Text style={styles.notesPublicBadge}>Casework Record</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              value={caseworkNotes}
              onChangeText={setCaseworkNotes}
              multiline
              numberOfLines={3}
              placeholder="Enter officer verification findings..."
              placeholderTextColor="#8e9bb0"
            />
          </View>
        </View>

        {/* Final Decision Action Buttons */}
        <View style={styles.btnSection}>
          <TouchableOpacity
            style={[styles.sealBtn, sealed && styles.sealBtnSuccess]}
            onPress={handleFinalizeDecision}
            disabled={submitting || sealed}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.sealBtnText}>Recording Decision...</Text>
              </>
            ) : sealed ? (
              <>
                <Text style={styles.sealBtnIcon}>✓</Text>
                <Text style={styles.sealBtnText}>Decision Recorded</Text>
              </>
            ) : (
              <>
                <Text style={styles.sealBtnIcon}>✍️</Text>
                <Text style={styles.sealBtnText}>Submit Officer Resolution Decision</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.returnBtn} onPress={onBack}>
            <Text style={styles.returnBtnIcon}>📁</Text>
            <Text style={styles.returnBtnText}>Return to Complaint Dossier</Text>
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
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  headerCard: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.secondaryContainer || '#708cfd',
  },
  woHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  woTitles: {
    flex: 1,
  },
  woCaseId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  woNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  woAwaitingPill: {
    backgroundColor: colors.surfaceContainerHigh || '#dce9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  woAwaitingIcon: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  woAwaitingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  woGrid: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  woGridCol: {
    width: '48%',
  },
  woGridColFull: {
    width: '100%',
    marginTop: 4,
  },
  woGridKey: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  woGridVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  woGridValCode: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  statutoryRuleBox: {
    backgroundColor: 'rgba(55,85,195,0.08)',
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statutoryIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  statutoryText: {
    fontSize: 11,
    color: colors.text,
    flex: 1,
    lineHeight: 16,
  },
  statutoryBold: {
    fontWeight: '700',
  },
  sectionWrap: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  evidenceCompareCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  compareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
  },
  compareTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hazardIcon: {
    fontSize: 12,
  },
  checkDoneIcon: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  compareTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  compareTime: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  compareImageWrap: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surfaceContainer,
    position: 'relative',
  },
  compareImage: {
    width: '100%',
    height: '100%',
  },
  geoTagOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,4,18,0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  geoTagText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  exifVerifiedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  exifVerifiedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compareFooter: {
    padding: spacing.sm,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.xs,
  },
  loggedBadge: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  loggedBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.secondary,
  },
  crewNoteWrap: {
    flex: 1,
  },
  crewNoteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  crewNoteHash: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
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
  cardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  radioList: {
    gap: spacing.xs,
  },
  radioItem: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  radioItemSelected: {
    backgroundColor: colors.surfaceContainerHigh || '#dce9ff',
    borderColor: colors.secondary,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  radioContent: {
    flex: 1,
  },
  radioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  radioTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  radioTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    fontFamily: 'monospace',
  },
  radioDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  guidanceBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  guidanceIcon: {
    fontSize: 14,
  },
  guidanceText: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
  guidanceBold: {
    fontWeight: '700',
    color: colors.text,
  },
  notesWrap: {
    marginTop: spacing.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  notesPublicBadge: {
    fontSize: 9,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  notesInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  btnSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  sealBtn: {
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
  sealBtnSuccess: {
    backgroundColor: '#15803d',
  },
  sealBtnIcon: {
    fontSize: 16,
    color: '#fff',
  },
  sealBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  returnBtn: {
    height: 44,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  returnBtnIcon: {
    fontSize: 14,
  },
  returnBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
