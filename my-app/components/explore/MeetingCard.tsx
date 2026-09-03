import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, ChevronRight, Users } from 'lucide-react-native';
import { MeetingRecord } from '@/hooks/useExploreMeetings';
import { MeetingStatusBadge } from './MeetingStatusBadge';

interface MeetingCardProps {
    item: MeetingRecord;
    onPress?: () => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ item, onPress }) => {
    const count = item.attendeesCount ?? item.attendees?.length ?? 0;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={styles.card}
            onPress={onPress}
            disabled={!onPress}
        >
            <Text style={styles.meetingTitle} numberOfLines={1}>
                {item.title || 'Untitled Meeting'}
            </Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Calendar size={13} color="#64748B" />
                    <Text style={styles.metaText}>{item.date || 'Recent'}</Text>
                </View>

                <View style={styles.metaItem}>
                    <Clock size={13} color="#64748B" />
                    <Text style={styles.metaText}>{item.duration || '00:00'}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                    <View style={styles.attendeesGroup}>
                        <Users size={13} color="#64748B" strokeWidth={2} />
                        <Text style={styles.attendeesText}>
                            {count} {count === 1 ? 'attendee' : 'attendees'}
                        </Text>
                    </View>

                    <MeetingStatusBadge status={item.status || 'processing'} />
                </View>

                {onPress && <ChevronRight size={16} color="#CBD5E1" />}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    meetingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attendeesGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    attendeesText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
});