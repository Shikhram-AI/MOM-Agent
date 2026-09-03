import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react-native';
import { MoMStatus } from '@/hooks/useExploreMeetings';

interface MeetingStatusBadgeProps {
    status: MoMStatus | string;
}

export const MeetingStatusBadge: React.FC<MeetingStatusBadgeProps> = ({ status }) => {
    switch (status) {
        case 'completed':
            return (
                <View style={[styles.badgeContainer, styles.badgeCompleted]}>
                    <CheckCircle2 size={12} color="#059669" strokeWidth={2.2} />
                    <Text style={[styles.badgeText, styles.badgeTextCompleted]}>Transcribed</Text>
                </View>
            );
        case 'failed':
            return (
                <View style={[styles.badgeContainer, styles.badgeFailed]}>
                    <AlertCircle size={12} color="#DC2626" strokeWidth={2.2} />
                    <Text style={[styles.badgeText, styles.badgeTextFailed]}>Failed</Text>
                </View>
            );
        case 'processing':
        default:
            return (
                <View style={[styles.badgeContainer, styles.badgeProcessing]}>
                    <Loader2 size={12} color="#D97706" strokeWidth={2.2} />
                    <Text style={[styles.badgeText, styles.badgeTextProcessing]}>Transcribing</Text>
                </View>
            );
    }
};

const styles = StyleSheet.create({
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    badgeCompleted: { backgroundColor: '#ECFDF5' },
    badgeProcessing: { backgroundColor: '#FEF3C7' },
    badgeFailed: { backgroundColor: '#FEF2F2' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    badgeTextCompleted: { color: '#059669' },
    badgeTextProcessing: { color: '#D97706' },
    badgeTextFailed: { color: '#DC2626' },
});