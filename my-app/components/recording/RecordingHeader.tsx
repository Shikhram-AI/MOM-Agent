import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ListFilter } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const RecordingHeader: React.FC = () => {
    const router = useRouter();

    return (
        <View style={styles.topHeader}>
            <View style={styles.aiBadge}>
                <Sparkles size={13} color="#6366F1" strokeWidth={2.2} />
                <Text style={styles.aiBadgeText}>MoM AI Engine</Text>
            </View>

            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.exploreLinkBtn}
                onPress={() => router.navigate('/(tabs)/explore')}
            >
                <ListFilter size={18} color="#475569" />
                <Text style={styles.exploreLinkText}>Explore</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    aiBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    exploreLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    exploreLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
});