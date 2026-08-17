import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Mic, Clock } from 'lucide-react-native';

interface RecordingStageProps {
    isRecording: boolean;
    formattedTime: string;
}

export const RecordingStage: React.FC<RecordingStageProps> = ({ isRecording, formattedTime, }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
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

    return (
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
    );
};

const styles = StyleSheet.create({
    centerStage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    visualContainer: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
    },
    pulseRing: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#EF4444'
    },
    micOrb: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3
    },
    micOrbIdle: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    micOrbActive: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1.5,
        borderColor: '#FECACA'
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    timer: {
        fontSize: 38,
        fontWeight: '700',
        color: '#0F172A',
        fontVariant: ['tabular-nums']
    },
    hintText: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 18
    },
});