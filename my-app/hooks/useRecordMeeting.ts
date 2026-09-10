import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { API_BASE_URL } from './api';

const KEEP_AWAKE_TAG = 'MIRA_RECORDING_SESSION';

interface UploadPayload {
    title: string;
    date: string;
    attendees: string[];
    created_by?: string;
}

export const useRecordMeeting = () => {
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordedDurationRef = useRef<number>(0);

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        stopTimer();
        timerRef.current = setInterval(() => {
            setSecondsElapsed((prev) => {
                const next = prev + 1;
                recordedDurationRef.current = next;
                return next;
            });
        }, 1000);
    };

    useEffect(() => {
        return () => {
            stopTimer();
            deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => { });
        };
    }, []);

    const formatTimer = (totalSeconds: number): string => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
    };

    const resetTimer = () => {
        stopTimer();
        setSecondsElapsed(0);
        recordedDurationRef.current = 0;
        setIsPaused(false);
    };

    const startRecording = async () => {
        try {
            const permission = await AudioModule.requestRecordingPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission Denied', 'Microphone permission is required to record meetings.');
                return;
            }

            await setAudioModeAsync({
                playsInSilentMode: true,
                allowsRecording: true,
            });

            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();

            // Prevent phone from locking/sleeping
            await activateKeepAwakeAsync(KEEP_AWAKE_TAG);

            setIsRecording(true);
            setIsPaused(false);
            setSecondsElapsed(0);
            recordedDurationRef.current = 0;

            startTimer();
        } catch (err: any) {
            console.error('Failed to start recording:', err);
            Alert.alert('Recording Error', 'Unable to start recording audio.');
        }
    };

    const pauseRecording = async () => {
        try {
            if (!isRecording || isPaused) return;

            // expo-audio supports pause()
            audioRecorder.pause();
            stopTimer();
            setIsPaused(true);

            // Allow device sleep while paused (optional; comment out if you want it awake while paused too)
            await deactivateKeepAwake(KEEP_AWAKE_TAG);
        } catch (err) {
            console.error('Failed to pause recording:', err);
        }
    };

    const resumeRecording = async () => {
        try {
            if (!isRecording || !isPaused) return;

            audioRecorder.record();
            await activateKeepAwakeAsync(KEEP_AWAKE_TAG);

            setIsPaused(false);
            startTimer();
        } catch (err) {
            console.error('Failed to resume recording:', err);
        }
    };

    const stopRecording = async (): Promise<string | null> => {
        try {
            stopTimer();
            setIsRecording(false);
            setIsPaused(false);

            await audioRecorder.stop();
            await setAudioModeAsync({ allowsRecording: false });
            await deactivateKeepAwake(KEEP_AWAKE_TAG);

            return audioRecorder.uri || null;
        } catch (err) {
            console.error('Failed to stop recording:', err);
            await deactivateKeepAwake(KEEP_AWAKE_TAG);
            return null;
        }
    };

    const uploadAndTranscribe = async (
        audioUri: string,
        { title, date, attendees, created_by }: UploadPayload
    ) => {
        if (!audioUri) throw new Error('No audio recording found.');
        setIsUploading(true);

        try {
            const formData = new FormData();
            const fileUri = Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri;
            const fileExtension = audioUri.split('.').pop() || 'm4a';

            formData.append('audio', {
                uri: fileUri,
                name: `meeting_${Date.now()}.${fileExtension}`,
                type: `audio/${fileExtension === 'm4a' ? 'mp4' : fileExtension}`,
            } as any);

            formData.append('title', title.trim() || 'Untitled Meeting');
            formData.append('date', date.trim() || new Date().toLocaleDateString());
            formData.append('duration', formatTimer(recordedDurationRef.current || secondsElapsed));
            formData.append('attendees', JSON.stringify(attendees || []));

            if (created_by) {
                formData.append('created_by', created_by.trim().toLowerCase());
            }

            const response = await fetch(`${API_BASE_URL}/meetings/transcribe`, {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
            });

            const json = await response.json();
            if (!response.ok || !json.success) {
                throw new Error(json.error || 'Failed to upload and transcribe audio.');
            }

            return json.data;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        isRecording,
        isPaused,
        secondsElapsed,
        formattedTime: formatTimer(secondsElapsed),
        isUploading,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        uploadAndTranscribe,
        resetTimer,
    };
};