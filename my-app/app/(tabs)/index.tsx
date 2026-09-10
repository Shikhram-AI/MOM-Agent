import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, Square, Pause, Play } from 'lucide-react-native';
import { useRecordMeeting } from '@/hooks/useRecordMeeting';

import { RecordingHeader } from '@/components/recording/RecordingHeader';
import { SessionSetupCard } from '@/components/recording/SessionSetupCard';
import { RecordingStage } from '@/components/recording/RecordingStage';
import { MetadataModal } from '@/components/recording/MetadataModal';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import { storage } from '@/hooks/storage';

export default function RecordMeetingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    isRecording,
    isPaused,
    formattedTime,
    isUploading,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadAndTranscribe,
    resetTimer,
  } = useRecordMeeting();

  const getCurrentFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
  const [meetingName, setMeetingName] = useState<string>('Sync with Core Team');
  const [meetingDate, setMeetingDate] = useState<string>(getCurrentFormattedDate());
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>([]);

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [defaultUserEmail, setDefaultUserEmail] = useState<string>('');

  useEffect(() => {
    async function checkVerificationStatus() {
      const verified = await storage.isUserVerified();
      if (!verified) {
        setShowAuthModal(true);
      } else {
        const savedEmail = await storage.getUserEmail();
        if (savedEmail) {
          setDefaultUserEmail(savedEmail);
          setAttendeeEmails((prev) =>
            prev.includes(savedEmail) ? prev : [savedEmail, ...prev]
          );
        }
      }
    }
    checkVerificationStatus();
  }, []);

  const handleVerified = (email: string) => {
    setDefaultUserEmail(email);
    setShowAuthModal(false);
    setAttendeeEmails((prev) =>
      prev.includes(email) ? prev : [email, ...prev]
    );
  };

  const handleStopRecording = async () => {
    const uri = await stopRecording();
    if (uri) {
      setMeetingDate(getCurrentFormattedDate());
      setRecordedUri(uri);
      setShowMetadataModal(true);
    }
  };

  const handleAddEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !attendeeEmails.includes(trimmed)) {
      setAttendeeEmails((prev) => [...prev, trimmed]);
    }
  };

  const handleRemoveEmail = (index: number) => {
    setAttendeeEmails((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmAndUpload = async () => {
    if (!recordedUri || isUploading) return;

    setShowMetadataModal(false);

    try {
      const finalAttendees = Array.from(
        new Set([defaultUserEmail, ...attendeeEmails].filter(Boolean))
      );

      if (finalAttendees.length > 0) {
        await storage.addAttendees(finalAttendees);
      }

      await uploadAndTranscribe(recordedUri, {
        title: meetingName.trim() || 'Untitled Meeting',
        date: meetingDate,
        attendees: finalAttendees,
        created_by: defaultUserEmail,
      });

      setAttendeeEmails(defaultUserEmail ? [defaultUserEmail] : []);
      setRecordedUri(null);
      if (resetTimer) resetTimer();
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
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <RecordingHeader />

      <SessionSetupCard
        meetingName={meetingName}
        meetingDate={meetingDate}
        isRecording={isRecording}
      />

      <RecordingStage
        isRecording={isRecording && !isPaused}
        formattedTime={formattedTime}
      />

      {/* Action Footer */}
      <View style={styles.footerSection}>
        {isRecording ? (
          <View style={styles.activeRecordingRow}>
            {/* Pause / Resume Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, styles.pauseButton]}
              onPress={isPaused ? resumeRecording : pauseRecording}
            >
              {isPaused ? (
                <>
                  <Play size={18} color="#0F172A" fill="#0F172A" />
                  <Text style={styles.pauseButtonLabel}>Resume</Text>
                </>
              ) : (
                <>
                  <Pause size={18} color="#0F172A" fill="#0F172A" />
                  <Text style={styles.pauseButtonLabel}>Pause</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Stop & Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, styles.stopButton]}
              onPress={handleStopRecording}
            >
              <Square size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.stopButtonLabel}>Stop & Process</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButton, styles.startButton]}
            onPress={startRecording}
          >
            <Mic size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.startButtonLabel}>Start Recording</Text>
          </TouchableOpacity>
        )}
      </View>

      <MetadataModal
        visible={showMetadataModal}
        meetingName={meetingName}
        meetingDate={meetingDate}
        attendeeEmails={attendeeEmails}
        onChangeMeetingName={setMeetingName}
        onChangeMeetingDate={setMeetingDate}
        onAddEmail={handleAddEmail}
        onRemoveEmail={handleRemoveEmail}
        onDiscard={() => {
          setShowMetadataModal(false);
          setRecordedUri(null);
        }}
        onSubmit={handleConfirmAndUpload}
      />

      <EmailVerificationModal
        visible={showAuthModal}
        onVerified={handleVerified}
      />

      <Modal visible={isUploading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingTitle}>Processing Minutes of Meeting</Text>
            <Text style={styles.loadingSubtitle}>
              Uploading audio to storage and transcribing meeting...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  footerSection: {
    width: '100%',
  },
  activeRecordingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 14,
    elevation: 3,
  },
  startButton: {
    width: '100%',
    backgroundColor: '#0F172A',
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stopButton: {
    flex: 1.4,
    backgroundColor: '#DC2626',
  },
  startButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  pauseButtonLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  stopButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingCard: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 6,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});