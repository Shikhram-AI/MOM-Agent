import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    Platform,
    StatusBar,
    Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, UserPlus, Mail, Users, CheckCircle2 } from 'lucide-react-native';
import { storage } from '@/hooks/storage';

export default function AttendeesScreen() {
    const insets = useSafeAreaInsets();
    const [attendees, setAttendees] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState<string>('');
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

    const loadData = async () => {
        const [savedList, userEmail] = await Promise.all([
            storage.getSavedAttendees(),
            storage.getUserEmail(),
        ]);
        setAttendees(savedList);
        if (userEmail) {
            setCurrentUserEmail(userEmail.toLowerCase().trim());
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async () => {
        const clean = newEmail.trim().toLowerCase();
        if (!clean || !clean.includes('@') || !clean.includes('.')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (attendees.some((e) => e.toLowerCase() === clean)) {
            Alert.alert('Already Exists', 'This email is already saved in your directory.');
            return;
        }

        const updated = await storage.addAttendees([clean]);
        setAttendees(updated);
        setNewEmail('');
        Keyboard.dismiss();
    };

    const confirmRemove = (email: string) => {
        Alert.alert(
            'Remove Attendee',
            `Are you sure you want to remove ${email} from your saved contacts?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const updated = await storage.removeAttendee(email);
                        setAttendees(updated);
                    },
                },
            ]
        );
    };

    const getInitials = (email: string): string => {
        const namePart = email.split('@')[0];
        return namePart.slice(0, 2).toUpperCase();
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16),
                    paddingBottom: insets.bottom + 16,
                },
            ]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle}>Attendee Directory</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{attendees.length}</Text>
                    </View>
                </View>
                <Text style={styles.headerSubtitle}>
                    Frequently used emails for instant selection when distributing meeting minutes.
                </Text>
            </View>

            {/* Input Card */}
            <View style={styles.inputCard}>
                <View style={styles.inputWrapper}>
                    <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                        style={styles.textInput}
                        placeholder="colleague@company.com"
                        placeholderTextColor="#94A3B8"
                        value={newEmail}
                        onChangeText={setNewEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleAdd}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.addButton, !newEmail.trim() && styles.addButtonDisabled]}
                    onPress={handleAdd}
                    activeOpacity={0.8}
                >
                    <UserPlus size={16} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.addButtonText}>Save</Text>
                </TouchableOpacity>
            </View>

            {/* Directory List */}
            <FlatList
                data={attendees}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const isSelf = item.toLowerCase() === currentUserEmail;

                    return (
                        <View style={[styles.attendeeCard, isSelf && styles.attendeeCardSelf]}>
                            <View style={styles.cardLeft}>
                                <View style={[styles.avatar, isSelf && styles.avatarSelf]}>
                                    <Text style={[styles.avatarText, isSelf && styles.avatarTextSelf]}>
                                        {getInitials(item)}
                                    </Text>
                                </View>

                                <View style={styles.emailContainer}>
                                    <View style={styles.emailRow}>
                                        <Text style={styles.emailText} numberOfLines={1}>
                                            {item}
                                        </Text>
                                        {isSelf && (
                                            <View style={styles.selfPill}>
                                                <Text style={styles.selfPillText}>You</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.emailStatus}>
                                        {isSelf ? 'Primary Account' : 'Saved Contact'}
                                    </Text>
                                </View>
                            </View>

                            {!isSelf && (
                                <TouchableOpacity
                                    onPress={() => confirmRemove(item)}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                    style={styles.deleteButton}
                                    activeOpacity={0.7}
                                >
                                    <Trash2 size={16} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Users size={32} color="#6366F1" />
                        </View>
                        <Text style={styles.emptyTitle}>No saved contacts</Text>
                        <Text style={styles.emptySubtitle}>
                            Add emails above or record a meeting to automatically build your attendee directory.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 18,
        marginTop: 6,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    countBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 19,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 18,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        gap: 8,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    inputIcon: {
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
        paddingVertical: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0F172A',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addButtonDisabled: {
        backgroundColor: '#94A3B8',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 24,
        gap: 10,
    },
    attendeeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    attendeeCardSelf: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    avatarSelf: {
        backgroundColor: '#0F172A',
        borderColor: '#0F172A',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },
    avatarTextSelf: {
        color: '#FFFFFF',
    },
    emailContainer: {
        flex: 1,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    emailText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        maxWidth: '82%',
    },
    selfPill: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    selfPillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
    },
    emailStatus: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 24,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 19,
    },
});