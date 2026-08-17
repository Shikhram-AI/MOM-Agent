import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { CheckCircle2, Users, Plus, X } from 'lucide-react-native';

interface MetadataModalProps {
    visible: boolean;
    meetingName: string;
    meetingDate: string;
    attendeeEmails: string[];
    onChangeMeetingName: (text: string) => void;
    onChangeMeetingDate: (text: string) => void;
    onAddEmail: (email: string) => void;
    onRemoveEmail: (index: number) => void;
    onDiscard: () => void;
    onSubmit: () => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
    visible,
    meetingName,
    meetingDate,
    attendeeEmails,
    onChangeMeetingName,
    onChangeMeetingDate,
    onAddEmail,
    onRemoveEmail,
    onDiscard,
    onSubmit,
}) => {
    const [currentEmailInput, setCurrentEmailInput] = useState<string>('');

    const handleAdd = () => {
        const trimmed = currentEmailInput.trim().toLowerCase().replace(/[, ]+/g, '');
        if (trimmed) {
            onAddEmail(trimmed);
            setCurrentEmailInput('');
        }
    };

    const handleConfirm = () => {
        if (currentEmailInput.trim()) {
            handleAdd();
        }
        onSubmit();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalCard}>
                    <Text style={styles.modalHeaderTitle}>Meeting & Distribution</Text>

                    <Text style={styles.modalDescription}>
                        Add attendee emails so the MoM agent can auto-share the minutes.
                    </Text>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Meeting Name</Text>

                            <TextInput
                                style={styles.textInput}
                                value={meetingName}
                                onChangeText={onChangeMeetingName}
                                placeholder="e.g. Sprint Sync"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Date</Text>

                            <TextInput
                                style={styles.textInput}
                                value={meetingDate}
                                onChangeText={onChangeMeetingDate}
                                placeholder="e.g. Aug 17, 2026"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.attendeeLabelRow}>
                                <Text style={styles.inputLabel}>Attendee Emails</Text>
                                <Text style={styles.attendeeCount}>{attendeeEmails.length} added</Text>
                            </View>

                            <View style={styles.emailInputWrapper}>
                                <TextInput
                                    style={styles.emailTextInput}
                                    value={currentEmailInput}
                                    onChangeText={setCurrentEmailInput}
                                    placeholder="name@company.com"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onSubmitEditing={handleAdd}
                                />

                                <TouchableOpacity
                                    style={styles.addEmailBtn}
                                    onPress={handleAdd}
                                >
                                    <Plus size={16} color="#4F46E5" strokeWidth={2.5} />
                                    <Text style={styles.addEmailBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>

                            {attendeeEmails.length > 0 && (
                                <View style={styles.chipsContainer}>
                                    {attendeeEmails.map((email, index) => (
                                        <View
                                            key={`${email}-${index}`}
                                            style={styles.emailChip}
                                        >
                                            <Users size={12} color="#475569" />
                                            <Text style={styles.emailChipText} numberOfLines={1}>{email}</Text>

                                            <TouchableOpacity onPress={() => onRemoveEmail(index)}>
                                                <X size={13} color="#94A3B8" strokeWidth={2.2} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onDiscard}>
                            <Text style={styles.cancelBtnText}>Discard</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                            <CheckCircle2 size={16} color="#FFFFFF" />
                            <Text style={styles.confirmBtnText}>Upload & Transcribe</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        paddingHorizontal: 16
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 22,
        maxHeight: '85%',
        elevation: 6
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4
    },
    modalDescription: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 16,
        lineHeight: 18
    },
    inputGroup: {
        marginBottom: 14
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 14,
        color: '#0F172A'
    },
    attendeeLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    attendeeCount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6366F1'
    },
    emailInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingRight: 6
    },
    emailTextInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 14,
        color: '#0F172A'
    },
    addEmailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },
    addEmailBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5'
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8
    },
    emailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    emailChipText: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '500',
        maxWidth: 180
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9'
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#F1F5F9'
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569'
    },
    confirmBtn: {
        flex: 2,
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#0F172A'
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF'
    },
});