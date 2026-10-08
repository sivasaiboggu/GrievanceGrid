import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { mobileApi } from '../../api';

export function OfficerWorkOrderDispatchModal({
  visible,
  complaint,
  issue,
  onClose,
  onSuccess,
}) {
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [instructions, setInstructions] = useState('');
  const [targetDays, setTargetDays] = useState('3');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Set initial instructions if issue provided
    if (issue) {
      setInstructions(`Dispatch directive for: ${issue.category || ''} - ${issue.description || ''}`);
    } else if (complaint) {
      setInstructions(`Dispatch directive for: ${complaint.title || complaint.category || 'Municipal Grievance Remediation'}`);
    }

    const loadMeta = async () => {
      try {
        setLoading(true);
        const [deptRes, workerRes] = await Promise.all([
          mobileApi.getDepartments().catch(() => []),
          mobileApi.getFieldWorkers().catch(() => []),
        ]);

        const depts = Array.isArray(deptRes) && deptRes.length > 0 ? deptRes : [
          { id: 'dept-1', name: 'Bureau of Street Lighting' },
          { id: 'dept-2', name: 'Dept. of Sanitation' },
          { id: 'dept-3', name: 'Roads & Pavement Infrastructure' },
          { id: 'dept-4', name: 'Water & Sewer Drainage' },
        ];
        setDepartments(depts);
        setSelectedDeptId(depts[0]?.id || '');

        const wrks = Array.isArray(workerRes) && workerRes.length > 0 ? workerRes : [
          { id: 'worker-1', name: 'Crew 04 (A. Vasquez - Electrical)' },
          { id: 'worker-2', name: 'Crew 09 (M. Kowalski - Bulk Compactor)' },
          { id: 'worker-3', name: 'Crew 02 (D. Jackson - Asphalt Patch)' },
        ];
        setWorkers(wrks);
        setSelectedWorkerId(wrks[0]?.id || '');
      } catch (err) {
        console.warn('Error fetching dispatch metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMeta();
  }, [visible, complaint, issue]);

  const handleDispatch = async () => {
    if (!complaint?.id) {
      Alert.alert('Error', 'No complaint context available for dispatch.');
      return;
    }
    if (!instructions.trim()) {
      Alert.alert('Validation Error', 'Please enter field dispatch instructions.');
      return;
    }

    try {
      setSubmitting(true);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + (parseInt(targetDays, 10) || 3));

      await mobileApi.createWorkOrder(complaint.id, {
        issue_id: issue?.id || null,
        department_id: selectedDeptId,
        assigned_to: selectedWorkerId,
        priority: priority,
        instructions: instructions.trim(),
        target_completion: targetDate.toISOString(),
      });

      Alert.alert(
        'Work Order Dispatched',
        'Official work order assigned to field crew. Case status updated to IN PROGRESS.',
        [{ text: 'OK', onPress: () => {
          onClose();
          if (onSuccess) onSuccess();
        }}]
      );
    } catch (err) {
      Alert.alert('Dispatch Failed', err.message || 'Unable to create work order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badgeText}>FIELD WORK ORDER</Text>
              <Text style={styles.title}>Dispatch Work Order</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.secondary} />
              <Text style={styles.loadingText}>Fetching department registries...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <Text style={styles.caseSub}>
                Case #{complaint?.tracking_id || complaint?.id?.slice(0, 8)} • {complaint?.address || 'Municipal Zone'}
              </Text>

              {/* Department Selection */}
              <Text style={styles.fieldLabel}>RESPONSIBLE BUREAU / DEPARTMENT</Text>
              <View style={styles.chipRow}>
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[styles.chip, selectedDeptId === dept.id && styles.chipActive]}
                    onPress={() => setSelectedDeptId(dept.id)}
                  >
                    <Text style={[styles.chipText, selectedDeptId === dept.id && styles.chipTextActive]}>
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Assigned Worker / Crew */}
              <Text style={styles.fieldLabel}>ASSIGNED FIELD CREW / SPECIALIST</Text>
              <View style={styles.chipRow}>
                {workers.map((worker) => (
                  <TouchableOpacity
                    key={worker.id}
                    style={[styles.chip, selectedWorkerId === worker.id && styles.chipActive]}
                    onPress={() => setSelectedWorkerId(worker.id)}
                  >
                    <Text style={[styles.chipText, selectedWorkerId === worker.id && styles.chipTextActive]}>
                      {worker.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Priority */}
              <Text style={styles.fieldLabel}>FIELD PRIORITY TIER</Text>
              <View style={styles.priorityRow}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      priority === p && styles.priorityBtnActive,
                      priority === p && p === 'CRITICAL' && styles.priorityBtnCritical,
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityBtnText,
                        priority === p && styles.priorityBtnTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Completion Target */}
              <Text style={styles.fieldLabel}>WORKFLOW COMPLETION TARGET</Text>
              <View style={styles.priorityRow}>
                {[
                  { label: '24 Hours', val: '1' },
                  { label: '48 Hours', val: '2' },
                  { label: '3 Days', val: '3' },
                  { label: '7 Days', val: '7' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[styles.priorityBtn, targetDays === item.val && styles.priorityBtnActive]}
                    onPress={() => setTargetDays(item.val)}
                  >
                    <Text style={[styles.priorityBtnText, targetDays === item.val && styles.priorityBtnTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Directives / Instructions */}
              <Text style={styles.fieldLabel}>FIELD INSTRUCTIONS & DIRECTIVES</Text>
              <TextInput
                style={styles.instructionInput}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
                placeholder="Specify precise repair directives, equipment requirements, safety notes..."
                placeholderTextColor="#8e9bb0"
              />

              {/* Submit Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleDispatch}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Issue Work Order →</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,4,18,0.65)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  caseSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  loadingWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formScroll: {
    paddingBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.surfaceContainerHigh || '#dce9ff',
    borderColor: colors.secondary,
  },
  chipText: {
    fontSize: 12,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priorityBtnCritical: {
    backgroundColor: '#991b1b',
    borderColor: '#991b1b',
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  priorityBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  instructionInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  submitBtn: {
    flex: 2,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
