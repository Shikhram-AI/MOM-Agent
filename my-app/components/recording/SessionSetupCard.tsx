import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radio, Calendar } from 'lucide-react-native';

interface SessionSetupCardProps {
    meetingName: string;
    meetingDate: string;
    isRecording: boolean;
}

export const SessionSetupCard: React.FC<SessionSetupCardProps> = ({
    meetingName,
    meetingDate,
    isRecording,
}) => {
    return (
        <View style={styles.card}>
            <View style={styles.cardTopRow}>
                <Text style={styles.cardSubtitle}>SESSION SETUP</Text>

                <View style={styles.statusPill}>
                    <Radio
                        size={12}
                        color={isRecording ? '#EF4444' : '#10B981'}
                        strokeWidth={2.5}
                    />
                    <Text
                        style={[
                            styles.statusPillText,
                            { color: isRecording ? '#DC2626' : '#059669' },
                        ]}
                    >
                        {isRecording ? 'Recording Live' : 'Idle'}
                    </Text>
                </View>
            </View>

            <Text style={styles.cardTitle} numberOfLines={1}>
                {meetingName || 'Sync with Core Team'}
            </Text>

            <View style={styles.metaRow}>
                <Calendar size={14} color="#64748B" />
                <Text style={styles.metaText}>{meetingDate || 'Recent'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardSubtitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.6,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: '#64748B',
    },
});