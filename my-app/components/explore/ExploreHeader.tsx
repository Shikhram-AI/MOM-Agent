import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export const ExploreHeader: React.FC = () => {
    const router = useRouter();

    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.screenHeading}>Meeting Minutes</Text>
                <Text style={styles.screenSubheading}>Recent recordings & transcripts</Text>
            </View>
            
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.newRecordBtn}
                onPress={() => router.push('/' as any)}
            >
                <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.newRecordText}>Record</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    screenHeading: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    screenSubheading: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    newRecordBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0F172A',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    newRecordText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});