import React, { useState } from 'react';
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
import { Mic, Square } from 'lucide-react-native';
import { useRecordMeeting } from '@/hooks/useRecordMeeting';

import { RecordingHeader } from '@/components/recording/RecordingHeader';
import { SessionSetupCard } from '@/components/recording/SessionSetupCard';
import { RecordingStage } from '@/components/recording/RecordingStage';
import { MetadataModal } from '@/components/recording/MetadataModal';

export default function RecordMeetingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    isRecording,
    formattedTime,
    isUploading,
    startRecording,
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

  // State
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
  const [meetingName, setMeetingName] = useState<string>('Sync with Core Team');
  const [meetingDate, setMeetingDate] = useState<string>(getCurrentFormattedDate());
  const [attendeeEmails, setAttendeeEmails] = useState<string[]>([]);

  const handleToggleRecord = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        setMeetingDate(getCurrentFormattedDate());
        setRecordedUri(uri);
        setShowMetadataModal(true);
      }
    } else {
      await startRecording();
    }
  };

  const handleAddEmail = (email: string) => {
    const trimmed = email.trim();
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
      await uploadAndTranscribe(recordedUri, {
        title: meetingName.trim() || 'Untitled Meeting',
        date: meetingDate,
        attendees: attendeeEmails,
      });

      setAttendeeEmails([]);
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
          paddingBottom: 20,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Top Bar Header */}
      <RecordingHeader />

      {/* Session Context Card */}
      <SessionSetupCard
        meetingName={meetingName}
        meetingDate={meetingDate}
        isRecording={isRecording}
      />

      {/* Central Visualizer and Timer */}
      <RecordingStage
        isRecording={isRecording}
        formattedTime={formattedTime}
      />

      {/* Action Footer */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.actionButton,
            isRecording ? styles.actionButtonStop : styles.actionButtonStart,
          ]}
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

      {/* Attendees & Metadata Modal */}
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

      {/* Uploading Overlay */}
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
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  footerSection: {
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 14,
    elevation: 3,
  },
  actionButtonStart: {
    backgroundColor: '#0F172A',
  },
  actionButtonStop: {
    backgroundColor: '#DC2626',
  },
  buttonLabel: {
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