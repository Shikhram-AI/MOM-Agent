import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, Animated, StatusBar, Platform, ScrollView, KeyboardAvoidingView, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, Square, Sparkles, Radio, Clock, Calendar, CheckCircle2, ListFilter, Users, Plus, X } from 'lucide-react-native';
import { useRecordMeeting } from '@/hooks/useRecordMeeting';

export default function RecordMeetingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Hook instance
  const {
    isRecording,
    formattedTime,
    isUploading,
    startRecording,
    stopRecording,
    uploadAndTranscribe,
  } = useRecordMeeting();

  // UI state
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
  const [meetingName, setMeetingName] = useState<string>('Sync with Core Team');
  const [meetingDate, setMeetingDate] = useState<string>('Aug 15, 2026');
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>([]);
  const [currentEmailInput, setCurrentEmailInput] = useState<string>('');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when recording
  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const handleToggleRecord = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        setRecordedUri(uri);
        setShowMetadataModal(true);
      }
    } else {
      await startRecording();
    }
  };

  const handleAddEmail = () => {
    const trimmed = currentEmailInput.trim().toLowerCase().replace(/[, ]+/g, '');
    if (trimmed && !attendeeEmails.includes(trimmed)) {
      setAttendeeEmails((prev) => [...prev, trimmed]);
      setCurrentEmailInput('');
    }
  };

  const handleRemoveEmail = (index: number) => {
    setAttendeeEmails((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmAndUpload = async () => {
    if (!recordedUri) return;
    if (currentEmailInput.trim()) handleAddEmail();

    setShowMetadataModal(false);

    try {
      await uploadAndTranscribe(recordedUri, {
        title: meetingName,
        date: meetingDate,
        attendees: attendeeEmails,
      });

      // Clear state and navigate
      setAttendeeEmails([]);
      setRecordedUri(null);
      router.push('/explore');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not process audio.');
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.aiBadge}>
          <Sparkles size={13} color="#6366F1" strokeWidth={2.2} />
          <Text style={styles.aiBadgeText}>MoM AI Engine</Text>
        </View>
        <TouchableOpacity style={styles.exploreLinkBtn} onPress={() => router.push('/explore')}>
          <ListFilter size={18} color="#475569" />
          <Text style={styles.exploreLinkText}>Explore</Text>
        </TouchableOpacity>
      </View>

      {/* Context Card */}
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardSubtitle}>SESSION SETUP</Text>
          <View style={styles.statusPill}>
            <Radio size={12} color={isRecording ? '#EF4444' : '#10B981'} strokeWidth={2.5} />
            <Text style={[styles.statusPillText, { color: isRecording ? '#DC2626' : '#059669' }]}>
              {isRecording ? 'Recording Live' : 'Idle'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{meetingName}</Text>
        <View style={styles.metaRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.metaText}>{meetingDate}</Text>
        </View>
      </View>

      {/* Center Stage */}
      <View style={styles.centerStage}>
        <View style={styles.visualContainer}>
          {isRecording && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.25],
                    outputRange: [0.35, 0.0],
                  }),
                },
              ]}
            />
          )}
          <View style={[styles.micOrb, isRecording ? styles.micOrbActive : styles.micOrbIdle]}>
            <Mic size={36} color={isRecording ? '#EF4444' : '#0F172A'} strokeWidth={1.8} />
          </View>
        </View>

        <View style={styles.timerRow}>
          <Clock size={16} color="#64748B" strokeWidth={2} />
          <Text style={styles.timer}>{formattedTime}</Text>
        </View>
        <Text style={styles.hintText}>
          {isRecording
            ? 'Transcribing audio feed in background...'
            : 'Press start to begin capturing the conversation'}
        </Text>
      </View>

      {/* Main Action Button */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.actionButton, isRecording ? styles.actionButtonStop : styles.actionButtonStart]}
          onPress={handleToggleRecord}
        >
          {isRecording ? (
            <>
              <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.buttonLabel}>Stop & Process MoM</Text>
            </>
          ) : (
            <>
              <Mic size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.buttonLabel}>Start Recording</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Metadata & Attendees Modal */}
      <Modal visible={showMetadataModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>Meeting & Distribution</Text>
            <Text style={styles.modalDescription}>
              Add attendee emails so the MoM agent can auto-share the minutes.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meeting Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={meetingName}
                  onChangeText={setMeetingName}
                  placeholder="e.g. Sprint Sync"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={meetingDate}
                  onChangeText={setMeetingDate}
                  placeholder="e.g. Aug 15, 2026"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.attendeeLabelRow}>
                  <Text style={styles.inputLabel}>Attendee Emails</Text>
                  <Text style={styles.attendeeCount}>{attendeeEmails.length} added</Text>
                </View>
                <View style={styles.emailInputWrapper}>
                  <TextInput
                    style={styles.emailTextInput}
                    value={currentEmailInput}
                    onChangeText={setCurrentEmailInput}
                    placeholder="name@company.com"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onSubmitEditing={handleAddEmail}
                  />
                  <TouchableOpacity style={styles.addEmailBtn} onPress={handleAddEmail}>
                    <Plus size={16} color="#4F46E5" strokeWidth={2.5} />
                    <Text style={styles.addEmailBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {attendeeEmails.length > 0 && (
                  <View style={styles.chipsContainer}>
                    {attendeeEmails.map((email, index) => (
                      <View key={`${email}-${index}`} style={styles.emailChip}>
                        <Users size={12} color="#475569" />
                        <Text style={styles.emailChipText} numberOfLines={1}>{email}</Text>
                        <TouchableOpacity onPress={() => handleRemoveEmail(index)}>
                          <X size={13} color="#94A3B8" strokeWidth={2.2} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowMetadataModal(false);
                  setRecordedUri(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAndUpload}>
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Upload & Transcribe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Uploading / Transcription Overlay */}
      <Modal visible={isUploading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingTitle}>Processing Minutes of Meeting</Text>
            <Text style={styles.loadingSubtitle}>
              Uploading audio to storage and transcribing via Groq Whisper...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA', paddingHorizontal: 20, justifyContent: 'space-between' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  aiBadgeText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  exploreLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F1F5F9' },
  exploreLinkText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardSubtitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  statusPillText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748B' },
  centerStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  visualContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pulseRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#EF4444' },
  micOrb: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  micOrbIdle: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  micOrbActive: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  timer: { fontSize: 38, fontWeight: '700', color: '#0F172A', fontVariant: ['tabular-nums'] },
  hintText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: 240, lineHeight: 18 },
  footerSection: { width: '100%' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 14, elevation: 3 },
  actionButtonStart: { backgroundColor: '#0F172A' },
  actionButtonStop: { backgroundColor: '#DC2626' },
  buttonLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, maxHeight: '85%', elevation: 6 },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  modalDescription: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 18 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0F172A' },
  attendeeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendeeCount: { fontSize: 11, fontWeight: '600', color: '#6366F1' },
  emailInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingRight: 6 },
  emailTextInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0F172A' },
  addEmailBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addEmailBtnText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  emailChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  emailChipText: { fontSize: 12, color: '#334155', fontWeight: '500', maxWidth: 180 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  confirmBtn: { flex: 2, flexDirection: 'row', gap: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#0F172A' },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.92)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingCard: { alignItems: 'center' },
  loadingTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginTop: 18, marginBottom: 6 },
  loadingSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19 },
});