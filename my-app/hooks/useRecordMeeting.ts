import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { API_BASE_URL } from './api';

interface UploadPayload {
    title: string;
    date: string;
    attendees: string[];
}

export const useRecordMeeting = () => {
    // Initialize expo-audio recorder with HIGH_QUALITY preset (.m4a)
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTimer = (totalSeconds: number): string => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
    };

    /**
     * Explicitly reset seconds counter & clear any running interval
     */
    const resetTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSecondsElapsed(0);
    };

    /**
     * Start recording audio with expo-audio
     */
    const startRecording = async () => {
        try {
            // 1. Request microphone permissions via AudioModule
            const permission = await AudioModule.requestRecordingPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission Denied', 'Microphone permission is required to record meetings.');
                return;
            }

            // 2. Set audio mode for recording
            await setAudioModeAsync({
                playsInSilentMode: true,
                allowsRecording: true,
            });

            // 3. Prepare and start recording
            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();

            setIsRecording(true);
            setSecondsElapsed(0);

            // 4. Start timer
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setSecondsElapsed((prev) => prev + 1);
            }, 1000);
        } catch (err: any) {
            console.error('Failed to start recording:', err);
            Alert.alert('Recording Error', 'Unable to start recording audio.');
        }
    };

    /**
     * Stop recording and get local file URI
     */
    const stopRecording = async (): Promise<string | null> => {
        try {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRecording(false);

            await audioRecorder.stop();
            await setAudioModeAsync({ allowsRecording: false });

            // In expo-audio, audioRecorder.uri contains the recorded file path
            const uri = audioRecorder.uri;
            return uri;
        } catch (err) {
            console.error('Failed to stop recording:', err);
            return null;
        }
    };

    /**
     * Upload audio to Express + Groq pipeline
     */
    const uploadAndTranscribe = async (
        audioUri: string,
        { title, date, attendees }: UploadPayload
    ) => {
        if (!audioUri) {
            throw new Error('No audio recording found.');
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            const fileUri = Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri;
            const fileExtension = audioUri.split('.').pop() || 'm4a';

            formData.append('audio', {
                uri: fileUri,
                name: `meeting_${Date.now()}.${fileExtension}`,
                type: `audio/${fileExtension}`,
            } as any);

            formData.append('title', title.trim() || 'Untitled Meeting');
            formData.append('date', date.trim() || new Date().toLocaleDateString());
            formData.append('duration', formatTimer(secondsElapsed));
            formData.append('attendees', JSON.stringify(attendees));

            const response = await fetch(`${API_BASE_URL}/meetings/transcribe`, {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
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
        secondsElapsed,
        formattedTime: formatTimer(secondsElapsed),
        isUploading,
        startRecording,
        stopRecording,
        uploadAndTranscribe,
        resetTimer,
    };
};